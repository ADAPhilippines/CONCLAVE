using System;
using System.Threading.Tasks;
using Conclave.Api.Interfaces.Services;
using Conclave.Api.Options;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Conclave.Api.Exceptions.Services;
using Conclave.Api.Exceptions.Data;
using Conclave.Api.Exceptions.Options;
using Microsoft.Extensions.Options;

namespace Conclave.Snapshot;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IServiceProvider _provider;
    private ConclaveEpoch? SeedEpoch { get; set; }
    private ConclaveEpoch? CurrentConclaveEpoch { get; set; }
    private ConclaveEpoch? NewConclaveEpoch { get; set; }
    private IServiceProvider _scopedProvider;

    // services

    private IConclaveEpochsService? EpochsService { get; set; }
    private IConclaveCardanoService? CardanoService { get; set; }
    private IConclaveEpochDelegatorService? EpochDelegatorService { get; set; }
    private IConclaveEpochDelegatorWorkerService? EpochDelegatorWorkerService { get; set; }
    private IConclaveSnapshotService? SnapshotService { get; set; }
    private IConclaveSnapshotSchedulerService? SnapshotSchedulerService { get; set; }
    private IConclaveSnapshotWorkerService? SnapshotWorkerService { get; set; }

    // options

    private IOptions<ConclaveOptions>? ConclaveOptions { get; set; }
    private IOptions<SnapshotOptions>? SnapshotOptions { get; set; }


    public Worker(ILogger<Worker> logger, IServiceProvider provider)
    {
        _logger = logger;
        _provider = provider;
        var scopedProvider = _provider.CreateScope().ServiceProvider;

        // services
        EpochsService = scopedProvider.GetService<IConclaveEpochsService>();
        CardanoService = scopedProvider.GetService<IConclaveCardanoService>();
        EpochDelegatorService = scopedProvider.GetService<IConclaveEpochDelegatorService>();
        EpochDelegatorWorkerService = scopedProvider.GetService<IConclaveEpochDelegatorWorkerService>();
        SnapshotService = scopedProvider.GetService<IConclaveSnapshotService>();
        SnapshotSchedulerService = scopedProvider.GetService<IConclaveSnapshotSchedulerService>();
        SnapshotWorkerService = scopedProvider.GetService<IConclaveSnapshotWorkerService>();

        //options
        ConclaveOptions = scopedProvider.GetService<IOptions<ConclaveOptions>>();
        SnapshotOptions = scopedProvider.GetService<IOptions<SnapshotOptions>>();

    }
    
    protected async override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // await ExecuteWorkerServiceAsync();
                await ExecuteTestWorkerServiceAsync();

            }
            catch (Exception e)
            {
                _logger.LogCritical(e.Message);
                await Task.Delay(120000, stoppingToken);
            }
        }
    }

    private async Task ExecuteWorkerServiceAsync()
    {
        await ExecuteSeederAsync();
        await ExecuteCurrentEpochSetterAsync();
        await ExecuteSnapshotSchedulerAsync();
        await ExecuteNewEpochCheckerAsync();
        await ExecuteDelegatorSnapshotAsync();
        await ExecuteHolderSnapshotAsync();
        await ExecuteNewEpochCreationSchedulerAsync();
        await ExecuteConclaveDelegatorFetcherAsync();
    }

    private async Task ExecuteTestWorkerServiceAsync()
    {
        await ExecuteSeederAsync();
        await ExecuteCurrentEpochSetterAsync();
        await ExecuteNewEpochCheckerAsync();
        await ExecuteDelegatorSnapshotAsync();
        await ExecuteHolderSnapshotAsync();
        await ExecuteTestNewEpochCreationSchedulerAsync();
        await ExecuteConclaveDelegatorFetcherAsync();
        await Task.Delay(900000000);
    }

    // Wrapper Methods

    private async Task ExecuteSeederAsync()
    {
        _logger.LogInformation($"{nameof(ExecuteSeederAsync)} running...");
        if (SeedEpoch is null)
        {
            _logger.LogInformation("SeedEpoch is null. Fetching seed epoch...");
            if (EpochsService is null) throw new ConclaveEpochsServiceNullException();

            SeedEpoch = GetSeedEpoch(EpochsService);

            if (SeedEpoch is null)
            {
                _logger.LogInformation("SeedEpoch not yet created. Creating seed epoch...");
                if (CardanoService is null) throw new CardanoServiceNullException();

                SeedEpoch = await CreateSeedEpoch(CardanoService, EpochsService);
            }
        }
        _logger.LogInformation($"Exiting {nameof(ExecuteSeederAsync)}");
    }

    private async Task ExecuteCurrentEpochSetterAsync()
    {
        _logger.LogInformation($"{nameof(ExecuteCurrentEpochSetterAsync)} running...");
        if (SeedEpoch is null) throw new SeedEpochNullException();

        if (CurrentConclaveEpoch is null)
        {
            _logger.LogInformation("Current conclave epoch is null. Setting current conclave epoch...");
            if (EpochsService is null) throw new ConclaveEpochsServiceNullException();

            var currentEpoch = EpochsService.GetByEpochStatus(EpochStatus.Current);
            CurrentConclaveEpoch = currentEpoch.FirstOrDefault() ?? SeedEpoch;
        }
        await Task.Delay(1);
        _logger.LogInformation($"Exiting {nameof(ExecuteCurrentEpochSetterAsync)}");
    }

    private async Task ExecuteSnapshotSchedulerAsync()
    {
        _logger.LogInformation($"{nameof(ExecuteSnapshotSchedulerAsync)} running...");

        if (SnapshotSchedulerService is null) throw new ConclaveSnapshotSchedulerServiceNullException();
        if (CurrentConclaveEpoch is null) throw new CurrentEpochNullException();
        if (SnapshotOptions is null) throw new SnapshotOptionNullException();

        var delayInMilliseconds = SnapshotSchedulerService.GetSnapshotDelayInMilliseconds(CurrentConclaveEpoch,
                                                                                          SnapshotOptions.Value.SnapshotBeforeMilliseconds);

        if (delayInMilliseconds > 0)
        {
            var delayInHours = (double)delayInMilliseconds / 1000 / 60 / 60;
            var days = delayInHours / 24;
            var hours = days % 1 * 24;
            var minutes = hours % 1 * 60;
            var seconds = minutes % 1 * 60;

            _logger.LogInformation($"Snapshot will execute after {(int)days} days {(int)hours} hours {(int)minutes} minutes {(int)seconds} seconds");
            await Task.Delay((int)delayInMilliseconds);
        }
        _logger.LogInformation($"Exiting {nameof(ExecuteSnapshotSchedulerAsync)}");
    }

    private async Task ExecuteNewEpochCheckerAsync()
    {
        _logger.LogInformation($"{nameof(ExecuteNewEpochCheckerAsync)} running...");
        if (NewConclaveEpoch is null)
        {
            if (EpochsService is null) throw new ConclaveEpochsServiceNullException();

            _logger.LogInformation("New conclave epoch is null. Fetching data from database...");
            var newEpoch = EpochsService.GetByEpochStatus(EpochStatus.New);
            NewConclaveEpoch = newEpoch == null ? null : newEpoch.FirstOrDefault();

            if (NewConclaveEpoch is null)
            {
                _logger.LogInformation("New conclave epoch not yet created. Creating now...");
                NewConclaveEpoch = await EpochsService.CreateAsync(new ConclaveEpoch
                {
                    EpochNumber = CurrentConclaveEpoch!.EpochNumber + 1,
                    StartTime = null,
                    EndTime = null,
                    EpochStatus = EpochStatus.New,
                    SnapshotStatus = SnapshotStatus.New,
                    RewardStatus = RewardStatus.New,
                    AirdropStatus = AirdropStatus.New,
                    DateCreated = DateUtils.DateTimeToUtc(DateTime.Now),
                    DateUpdated = DateUtils.DateTimeToUtc(DateTime.Now)
                });
            }
        }
        _logger.LogInformation($"Exiting {nameof(ExecuteNewEpochCheckerAsync)}");
    }

    private async Task ExecuteDelegatorSnapshotAsync()
    {
        _logger.LogInformation($"{nameof(ExecuteDelegatorSnapshotAsync)} running...");
        if (NewConclaveEpoch!.SnapshotStatus == SnapshotStatus.New)
        {
            _logger.LogInformation("Taking delegator snapshot now...");
            if (SnapshotWorkerService is null) throw new ConclaveSnapshotWorkerServiceNullException();
            if (ConclaveOptions is null) throw new ConclaveOptionNullException();

            var snapshotList = await SnapshotWorkerService.SnapshotUniqueDelegatorsForPoolsAsync(ConclaveOptions.Value.PoolIds, NewConclaveEpoch);

            try
            {
                if (snapshotList is not null)
                    await SnapshotWorkerService.StoreDelegatorSnapshotDataAsync(snapshotList);

                if (EpochsService is null) throw new ConclaveEpochsServiceNullException();

                NewConclaveEpoch.SnapshotStatus = SnapshotStatus.InProgress;
                await EpochsService.Update(NewConclaveEpoch.Id, NewConclaveEpoch);
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message);
            }
            _logger.LogInformation("Delegator Snapshot done...");
        }
        _logger.LogInformation($"Exiting {nameof(ExecuteDelegatorSnapshotAsync)}");
    }

    private async Task ExecuteHolderSnapshotAsync()
    {
        _logger.LogInformation($"{nameof(ExecuteDelegatorSnapshotAsync)} running...");
        if (NewConclaveEpoch == null) throw new NewEpochNullException();

        if (NewConclaveEpoch.SnapshotStatus == SnapshotStatus.InProgress)
        {
            _logger.LogInformation("Taking holder snapshot now...");
            if (ConclaveOptions is null) throw new ConclaveOptionNullException();
            if (SnapshotWorkerService is null) throw new ConclaveSnapshotWorkerServiceNullException();

            var snapshotList = await SnapshotWorkerService.SnapshotUniqueHoldersForAssetAsync(ConclaveOptions.Value.ConclaveAddress,
                                                                                              NewConclaveEpoch);

            try
            {
                if (snapshotList is not null)
                    await SnapshotWorkerService.StoreHolderSnapshotDataAsync(snapshotList);

            }
            catch (Exception e)
            {
                _logger.LogError(e.Message);
            }
            _logger.LogInformation("Holder Snapshot done...");
        }
    }

    private async Task ExecuteNewEpochCreationSchedulerAsync()
    {
        _logger.LogInformation($"{nameof(ExecuteNewEpochCreationSchedulerAsync)} running...");

        if (SnapshotOptions is null) throw new SnapshotOptionNullException();

        while (NewConclaveEpoch is not null)
        {
            _logger.LogInformation("Fetching new epoch data...");
            if (NewConclaveEpoch.SnapshotStatus == SnapshotStatus.InProgress)
            {
                if (SnapshotSchedulerService is null) throw new ConclaveSnapshotSchedulerServiceNullException();
                if (CurrentConclaveEpoch is null) throw new CurrentEpochNullException();

                var delayInMilliseconds = SnapshotSchedulerService.GetNewEpochCreationDelayInMilliseconds(CurrentConclaveEpoch,
                                                                                                          SnapshotOptions.Value.SnapshotCompleteAfterMilliseconds);

                if (delayInMilliseconds > 0)
                {
                    var delayInMinutes = ((double)delayInMilliseconds / 1000 / 60).ToString();
                    _logger.LogInformation($"Capturing new epoch data in {delayInMinutes} minutes...");
                    await Task.Delay((int)delayInMilliseconds);
                }
            }

            if (CardanoService is null) throw new CardanoServiceNullException();

            var currentEpoch = await CardanoService.GetCurrentEpochAsync();
            if (currentEpoch!.Number == NewConclaveEpoch.EpochNumber)
            {
                _logger.LogInformation("New epoch created. Updating statuses...");
                NewConclaveEpoch.StartTime = currentEpoch.StartTime;
                NewConclaveEpoch.EndTime = currentEpoch.EndTime;
                NewConclaveEpoch.SnapshotStatus = SnapshotStatus.Completed;
                NewConclaveEpoch.EpochStatus = EpochStatus.Current;

                if (EpochsService is null) throw new ConclaveEpochsServiceNullException();

                await EpochsService.Update(NewConclaveEpoch.Id, NewConclaveEpoch);

                if (CurrentConclaveEpoch == null) throw new CurrentEpochNullException();
                if (CurrentConclaveEpoch.EpochStatus != EpochStatus.Seed) CurrentConclaveEpoch.EpochStatus = EpochStatus.Old;

                await EpochsService.Update(CurrentConclaveEpoch.Id, CurrentConclaveEpoch);
                await EpochsService.Update(NewConclaveEpoch.Id, NewConclaveEpoch);

                CurrentConclaveEpoch = NewConclaveEpoch;
                NewConclaveEpoch = null;
            }
            else
            {
                await Task.Delay((int)SnapshotOptions.Value.SnapshotCompleteAfterMilliseconds);
            }
        }
        _logger.LogInformation($"Exiting {nameof(ExecuteNewEpochCreationSchedulerAsync)}");
    }

    private async Task ExecuteTestNewEpochCreationSchedulerAsync()
    {

        _logger.LogInformation($"{nameof(ExecuteTestNewEpochCreationSchedulerAsync)} running...");
        _logger.LogInformation("New epoch created. Updating statuses...");

        if (NewConclaveEpoch is null || CurrentConclaveEpoch is null) throw new Exception("New or current conclave epoch is null!");
        NewConclaveEpoch.SnapshotStatus = SnapshotStatus.Completed;
        NewConclaveEpoch.EpochStatus = EpochStatus.Current;

        if (EpochsService is null) throw new ConclaveEpochsServiceNullException();

        await EpochsService.Update(NewConclaveEpoch.Id, NewConclaveEpoch);

        if (CurrentConclaveEpoch.EpochStatus != EpochStatus.Seed) CurrentConclaveEpoch.EpochStatus = EpochStatus.Old;

        await EpochsService.Update(CurrentConclaveEpoch.Id, CurrentConclaveEpoch);
        await EpochsService.Update(NewConclaveEpoch.Id, NewConclaveEpoch);

        CurrentConclaveEpoch = NewConclaveEpoch;
        NewConclaveEpoch = null;
    }
    private async Task ExecuteConclaveDelegatorFetcherAsync()
    {
        _logger.LogInformation($"{nameof(ExecuteConclaveDelegatorFetcherAsync)} running...");
        if (CurrentConclaveEpoch is null) throw new CurrentEpochNullException();

        if (NewConclaveEpoch is null && CurrentConclaveEpoch.SnapshotStatus == SnapshotStatus.Completed)
        {

            if (EpochDelegatorService is null) throw new Exception("EpochDelegatorService is null");

            var currentConclaveDelegators = EpochDelegatorService.GetAllByEpochNumber(CurrentConclaveEpoch.EpochNumber)
                                            ?? new List<ConclaveEpochDelegator>();

            if (!currentConclaveDelegators.Any())
            {
                _logger.LogInformation("Fetching wallet address and creating conclave delegator entries on the database...");
                if (SnapshotService is null) throw new ConclaveSnapshotServiceNullException();

                var snapshotList = SnapshotService.GetByEpochNumber(CurrentConclaveEpoch.EpochNumber);

                if (snapshotList == null) throw new Exception("Snapshot list is null!");
                if (EpochDelegatorWorkerService is null) throw new Exception("EpochDelegatorWorkerService is null");

                var conclaveDelegators = await EpochDelegatorWorkerService.GetAllConclaveDelegatorsFromSnapshotListAsync(snapshotList);

                if (conclaveDelegators == null) throw new Exception("Conclave delegators is null!");
                await EpochDelegatorWorkerService.StoreConclaveDelegatorsAsync(conclaveDelegators);
            }
        }
        _logger.LogInformation($"Exiting {nameof(ExecuteConclaveDelegatorFetcherAsync)}");
    }

    // Helper Methods

    private static ConclaveEpoch? GetSeedEpoch(IConclaveEpochsService service)
    {
        return service.GetByEpochStatus(EpochStatus.Seed).FirstOrDefault();
    }

    private static async Task<ConclaveEpoch> CreateSeedEpoch(IConclaveCardanoService conclaveCardanoService,
                                                             IConclaveEpochsService conclaveEpochsService)
    {
        var currentEpoch = await conclaveCardanoService.GetCurrentEpochAsync();

        var seedEpoch = await conclaveEpochsService.CreateAsync(new ConclaveEpoch
        {
            EpochNumber = currentEpoch!.Number,
            StartTime = currentEpoch.StartTime,
            EndTime = currentEpoch.EndTime,
            EpochStatus = EpochStatus.Seed,
            SnapshotStatus = SnapshotStatus.Skip,
            RewardStatus = RewardStatus.Skip,
            AirdropStatus = AirdropStatus.Skip,
            DateCreated = DateUtils.DateTimeToUtc(DateTime.Now),
            DateUpdated = DateUtils.DateTimeToUtc(DateTime.Now)
        });

        return seedEpoch;
    }
}