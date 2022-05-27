using System;
using System.Threading.Tasks;
using Conclave.Api.Exceptions;
using Conclave.Api.Interfaces.Services;
using Conclave.Api.Options;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Conclave.Common.Utils;
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

    public Worker(ILogger<Worker> logger, IServiceProvider provider)
    {
        _logger = logger;
        _provider = provider;
    }
    protected async override Task ExecuteAsync(CancellationToken stoppingToken)
    {

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _provider.CreateScope();
                _scopedProvider = scope.ServiceProvider;

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
    }

    // Wrapper Methods

    private async Task ExecuteSeederAsync()
    {
        _logger.LogInformation($"{nameof(ExecuteSeederAsync)} running...");
        if (SeedEpoch is null)
        {
            _logger.LogInformation("SeedEpoch is null. Fetching seed epoch...");
            SeedEpoch = GetSeedEpoch(_scopedProvider);

            if (SeedEpoch is null)
            {
                _logger.LogInformation("SeedEpoch not yet created. Creating seed epoch...");
                SeedEpoch = await CreateSeedEpoch(_scopedProvider);
            }
        }
        _logger.LogInformation($"Exiting {nameof(ExecuteSeederAsync)}");
    }

    private async Task ExecuteCurrentEpochSetterAsync()
    {
        _logger.LogInformation($"{nameof(ExecuteCurrentEpochSetterAsync)} running...");
        if (SeedEpoch is null) throw new Exception("No seed found!");

        if (CurrentConclaveEpoch is null)
        {
            _logger.LogInformation("Current conclave epoch is null. Setting current conclave epoch...");
            var epochService = _scopedProvider.GetRequiredService<IConclaveEpochsService>();
            CurrentConclaveEpoch = epochService.GetByEpochStatus(EpochStatus.Current).FirstOrDefault() ?? SeedEpoch;
        }
        await Task.Delay(1);
        _logger.LogInformation($"Exiting {nameof(ExecuteCurrentEpochSetterAsync)}");
    }

    private async Task ExecuteSnapshotSchedulerAsync()
    {
        _logger.LogInformation($"{nameof(ExecuteSnapshotSchedulerAsync)} running...");
        var snapshotSchedulerService = _scopedProvider.GetRequiredService<IConclaveSnapshotSchedulerService>();
        var delayInMilliseconds = snapshotSchedulerService.GetSnapshotDelayInMilliseconds(CurrentConclaveEpoch!, 60 * 60 * 1000);

        if (delayInMilliseconds > 0)
        {
            var delayInHours = (double)delayInMilliseconds / 1000 / 60 / 60;
            var days = delayInHours / 24; // 
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
            _logger.LogInformation("New conclave epoch is null. Fetching data from database...");
            var epochService = _scopedProvider.GetRequiredService<IConclaveEpochsService>();
            NewConclaveEpoch = epochService.GetByEpochStatus(EpochStatus.New).FirstOrDefault();

            if (NewConclaveEpoch is null)
            {
                _logger.LogInformation("New conclave epoch not yet created. Creating now...");
                NewConclaveEpoch = await epochService.CreateAsync(new ConclaveEpoch
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
            var epochService = _scopedProvider.GetRequiredService<IConclaveEpochsService>();
            var snapshotService = _scopedProvider.GetRequiredService<IConclaveSnapshotWorkerService>();
            var snapshotSettings = _scopedProvider.GetRequiredService<IOptions<ConclaveCardanoOptions>>();

            var snapshotList = await snapshotService.SnapshotUniqueDelegatorsForPoolsAsync(snapshotSettings.Value.PoolIds, NewConclaveEpoch);
            try
            {
                await snapshotService.StoreDelegatorSnapshotDataAsync(snapshotList);
                NewConclaveEpoch.SnapshotStatus = SnapshotStatus.InProgress;
                await epochService.Update(NewConclaveEpoch.Id, NewConclaveEpoch);
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
        if (NewConclaveEpoch.SnapshotStatus == SnapshotStatus.InProgress)
        {
            _logger.LogInformation("Taking holder snapshot now...");
            var epochService = _scopedProvider.GetRequiredService<IConclaveEpochsService>();
            var snapshotService = _scopedProvider.GetRequiredService<IConclaveSnapshotWorkerService>();
            var snapshotSettings = _scopedProvider.GetRequiredService<IOptions<ConclaveCardanoOptions>>();

            var snapshotList = await snapshotService.SnapshotUniqueHoldersForAssetAsync(snapshotSettings.Value.ConclaveAddress, NewConclaveEpoch);
            try
            {
                await snapshotService.StoreHolderSnapshotDataAsync(snapshotList);
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
        var snapshotSchedulerService = _scopedProvider.GetRequiredService<IConclaveSnapshotSchedulerService>();
        var cardanoService = _scopedProvider.GetRequiredService<IConclaveCardanoService>();
        var epochService = _scopedProvider.GetRequiredService<IConclaveEpochsService>();

        while (NewConclaveEpoch is not null)
        {
            _logger.LogInformation("Fetching new epoch data...");
            if (NewConclaveEpoch.SnapshotStatus == SnapshotStatus.InProgress)
            {
                var delayInMilliseconds = snapshotSchedulerService.GetNewEpochCreationDelayInMilliseconds(CurrentConclaveEpoch!, 60 * 61 * 1000);

                if (delayInMilliseconds > 0)
                {
                    var delayInMinutes = ((double)delayInMilliseconds / 1000 / 60).ToString();
                    _logger.LogInformation($"Capturing new epoch data in {delayInMinutes} minutes...");
                    await Task.Delay((int)delayInMilliseconds);
                }
            }
            var currentEpoch = await cardanoService.GetCurrentEpochAsync();
            if (currentEpoch!.Number == NewConclaveEpoch.EpochNumber)
            {
                _logger.LogInformation("New epoch created. Updating statuses...");
                NewConclaveEpoch.StartTime = currentEpoch.StartTime;
                NewConclaveEpoch.EndTime = currentEpoch.EndTime;
                NewConclaveEpoch.SnapshotStatus = SnapshotStatus.Completed;
                NewConclaveEpoch.EpochStatus = EpochStatus.Current;

                await epochService.Update(NewConclaveEpoch.Id, NewConclaveEpoch);

                if (CurrentConclaveEpoch.EpochStatus != EpochStatus.Seed)
                {
                    CurrentConclaveEpoch.EpochStatus = EpochStatus.Old;
                }

                await epochService.Update(CurrentConclaveEpoch.Id, CurrentConclaveEpoch);
                await epochService.Update(NewConclaveEpoch.Id, NewConclaveEpoch);

                CurrentConclaveEpoch = NewConclaveEpoch;
                NewConclaveEpoch = null;
            }
            else
            {
                await Task.Delay(60 * 5 * 1000);
            }
        }
        _logger.LogInformation($"Exiting {nameof(ExecuteNewEpochCreationSchedulerAsync)}");
    }

    private async Task ExecuteTestNewEpochCreationSchedulerAsync()
    {

        _logger.LogInformation($"{nameof(ExecuteTestNewEpochCreationSchedulerAsync)} running...");
        var snapshotSchedulerService = _scopedProvider.GetRequiredService<IConclaveSnapshotSchedulerService>();
        var cardanoService = _scopedProvider.GetRequiredService<IConclaveCardanoService>();
        var epochService = _scopedProvider.GetRequiredService<IConclaveEpochsService>();

        _logger.LogInformation("New epoch created. Updating statuses...");
        NewConclaveEpoch.SnapshotStatus = SnapshotStatus.Completed;
        NewConclaveEpoch.EpochStatus = EpochStatus.Current;

        await epochService.Update(NewConclaveEpoch.Id, NewConclaveEpoch);

        if (CurrentConclaveEpoch.EpochStatus != EpochStatus.Seed)
        {
            CurrentConclaveEpoch.EpochStatus = EpochStatus.Old;
        }

        await epochService.Update(CurrentConclaveEpoch.Id, CurrentConclaveEpoch);
        await epochService.Update(NewConclaveEpoch.Id, NewConclaveEpoch);

        CurrentConclaveEpoch = NewConclaveEpoch;
        NewConclaveEpoch = null;
    }
    private async Task ExecuteConclaveDelegatorFetcherAsync()
    {
        _logger.LogInformation($"{nameof(ExecuteConclaveDelegatorFetcherAsync)} running...");
        if (NewConclaveEpoch is null && CurrentConclaveEpoch!.SnapshotStatus == SnapshotStatus.Completed)
        {
            var cardanoService = _scopedProvider.GetRequiredService<IConclaveCardanoService>();
            var snapshotService = _scopedProvider.GetRequiredService<IConclaveSnapshotService>();
            var conclaveDelegatorService = _scopedProvider.GetRequiredService<IConclaveEpochDelegatorService>();
            var conclaveDelegatorWorkerService = _scopedProvider.GetRequiredService<IConclaveEpochDelegatorWorkerService>();

            var currentConclaveDelegators = conclaveDelegatorService.GetAllByEpochNumber(CurrentConclaveEpoch.EpochNumber);

            if (!currentConclaveDelegators.Any())
            {
                _logger.LogInformation("Fetching wallet address and creating conclave delegator entries on the database...");
                // FETCH
                var snapshotList = snapshotService.GetByEpochNumber(CurrentConclaveEpoch.EpochNumber);
                var conclaveDelegators = await conclaveDelegatorWorkerService.GetAllConclaveDelegatorsFromSnapshotListAsync(snapshotList);
                await conclaveDelegatorWorkerService.StoreConclaveDelegatorsAsync(conclaveDelegators);
            }
        }
        _logger.LogInformation($"Exiting {nameof(ExecuteConclaveDelegatorFetcherAsync)}");
    }

    // Helper Methods

    private static ConclaveEpoch? GetSeedEpoch(IServiceProvider provider)
    {
        var epochService = provider.GetRequiredService<IConclaveEpochsService>();
        var seedEpoch = epochService.GetByEpochStatus(EpochStatus.Seed).FirstOrDefault();

        return seedEpoch;
    }

    private static async Task<ConclaveEpoch> CreateSeedEpoch(IServiceProvider provider)
    {
        var epochService = provider.GetRequiredService<IConclaveEpochsService>();
        var cardanoService = provider.GetRequiredService<IConclaveCardanoService>();

        var currentEpoch = await cardanoService.GetCurrentEpochAsync();

        var seedEpoch = await epochService.CreateAsync(new ConclaveEpoch
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

        if (seedEpoch is null) throw new Exception("Cannot create conclave epoch");

        return seedEpoch;
    }
}