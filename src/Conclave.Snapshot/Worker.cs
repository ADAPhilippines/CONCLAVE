using System;
using System.Threading.Tasks;
using Conclave.Api.Exceptions;
using Conclave.Api.Interfaces.Services;
using Conclave.Api.Options;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Conclave.Common.Utils;

namespace Conclave.Snapshot;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IServiceProvider _provider;

    private ConclaveEpoch? SeedEpoch { get; set; }
    private ConclaveEpoch? CurrentConclaveEpoch { get; set; }
    private ConclaveEpoch? NewConclaveEpoch { get; set; }

    public Worker(ILogger<Worker> logger, IServiceProvider provider)
    {
        _logger = logger;
        _provider = provider;
    }
    protected async override Task ExecuteAsync(CancellationToken stoppingToken)
    {

        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = _provider.CreateScope();

            await ExecuteSeederAsync(scope);
            await ExecuteCurrentEpochSetterAsync(scope);
            await ExecuteSnapshotSchedulerAsync(scope);
            await ExecuteNewEpochCheckerAsync(scope);
            await ExecuteSnapshotAsync(scope);
            await ExecuteNewEpochCreationSchedulerAsync(scope);
        }
    }

    // Wrapper Methods

    private async Task ExecuteSeederAsync(IServiceScope scope)
    {
        _logger.LogInformation($"{nameof(ExecuteSeederAsync)} running...");
        if (SeedEpoch is null)
        {
            _logger.LogInformation("SeedEpoch is null. Fetching seed epoch...");
            SeedEpoch = GetSeedEpoch(scope);

            if (SeedEpoch is null)
            {
                _logger.LogInformation("SeedEpoch not yet created. Creating seed epoch...");
                SeedEpoch = await CreateSeedEpoch(scope);
            }
        }
        _logger.LogInformation($"Exiting {nameof(ExecuteSeederAsync)}");
    }

    private async Task ExecuteCurrentEpochSetterAsync(IServiceScope scope)
    {
        _logger.LogInformation($"{nameof(ExecuteCurrentEpochSetterAsync)} running...");
        if (SeedEpoch is null) throw new Exception("No seed found!");

        if (CurrentConclaveEpoch is null)
        {
            _logger.LogInformation("Current conclave epoch is null. Setting current conclave epoch...");
            var epochService = scope.ServiceProvider.GetRequiredService<IConclaveEpochsService>();
            CurrentConclaveEpoch = epochService.GetByEpochStatus(EpochStatus.Current).FirstOrDefault() ?? SeedEpoch;
        }
        await Task.Delay(1);
        _logger.LogInformation($"Exiting {nameof(ExecuteCurrentEpochSetterAsync)}");
    }

    private async Task ExecuteSnapshotSchedulerAsync(IServiceScope scope)
    {
        _logger.LogInformation($"{nameof(ExecuteSnapshotSchedulerAsync)} running...");
        var snapshotSchedulerService = scope.ServiceProvider.GetRequiredService<IConclaveSnapshotSchedulerService>();
        var delayInMilliseconds = snapshotSchedulerService.GetSnapshotDelayInMilliseconds(CurrentConclaveEpoch!, 60 * 10 * 1000);

        if (delayInMilliseconds > 0)
        {
            var delayInDays = ((double)delayInMilliseconds / 1000 / 60 / 60 / 24).ToString();
            var delayInHours = ((double)delayInMilliseconds / 1000 / 60 / 60).ToString();
            _logger.LogInformation($"Snapshot will execute after {delayInDays} days...");
            _logger.LogInformation($"Snapshot will execute after {delayInHours} hours...");
            await Task.Delay((int)delayInMilliseconds);
        }
        _logger.LogInformation($"Exiting {nameof(ExecuteSnapshotSchedulerAsync)}");
    }
    private async Task ExecuteNewEpochCheckerAsync(IServiceScope scope)
    {
        _logger.LogInformation($"{nameof(ExecuteNewEpochCheckerAsync)} running...");
        if (NewConclaveEpoch is null)
        {
            _logger.LogInformation("New conclave epoch is null. Fetching data from database...");
            var epochService = scope.ServiceProvider.GetRequiredService<IConclaveEpochsService>();
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

    private async Task ExecuteSnapshotAsync(IServiceScope scope)
    {
        _logger.LogInformation($"{nameof(ExecuteSnapshotAsync)} running...");
        if (NewConclaveEpoch!.SnapshotStatus == SnapshotStatus.New)
        {
            _logger.LogInformation("Taking snapshot now...");
            var epochService = scope.ServiceProvider.GetRequiredService<IConclaveEpochsService>();
            var snapshotService = scope.ServiceProvider.GetRequiredService<IConclaveSnapshotWorkerService>();
            var snapshotSettings = scope.ServiceProvider.GetRequiredService<ConclaveCardanoOptions>();

            NewConclaveEpoch.SnapshotStatus = SnapshotStatus.InProgress;

            await epochService.Update(NewConclaveEpoch.Id, NewConclaveEpoch);

            var snapshotList = await snapshotService.SnapshotUniqueDelegatorsForPoolsAsync(snapshotSettings.PoolIds, NewConclaveEpoch);
            await snapshotService.StoreSnapshotDataAsync(snapshotList);
            _logger.LogInformation("Snapshot done...");
        }
        _logger.LogInformation($"Exiting {nameof(ExecuteSnapshotAsync)}");
    }

    private async Task ExecuteNewEpochCreationSchedulerAsync(IServiceScope scope)
    {
        _logger.LogInformation($"{nameof(ExecuteNewEpochCreationSchedulerAsync)} running...");
        var snapshotSchedulerService = scope.ServiceProvider.GetRequiredService<IConclaveSnapshotSchedulerService>();
        var cardanoService = scope.ServiceProvider.GetRequiredService<IConclaveCardanoService>();
        var epochService = scope.ServiceProvider.GetRequiredService<IConclaveEpochsService>();

        while (NewConclaveEpoch is not null)
        {
            _logger.LogInformation("Fetching new epoch data...");
            if (NewConclaveEpoch.SnapshotStatus == SnapshotStatus.InProgress)
            {
                var delayInMilliseconds = snapshotSchedulerService.GetNewEpochCreationDelayInMilliseconds(CurrentConclaveEpoch!, 60 * 10 * 1000);

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

                CurrentConclaveEpoch = NewConclaveEpoch;
                NewConclaveEpoch = null;
            }
        }
        _logger.LogInformation($"Exiting {nameof(ExecuteNewEpochCreationSchedulerAsync)}");
    }

    // Helper Methods

    private static ConclaveEpoch? GetSeedEpoch(IServiceScope scope)
    {
        var epochService = scope.ServiceProvider.GetRequiredService<IConclaveEpochsService>();
        var seedEpoch = epochService.GetByEpochStatus(EpochStatus.Seed).FirstOrDefault();

        return seedEpoch;
    }

    private static async Task<ConclaveEpoch> CreateSeedEpoch(IServiceScope scope)
    {
        var epochService = scope.ServiceProvider.GetRequiredService<IConclaveEpochsService>();
        var cardanoService = scope.ServiceProvider.GetRequiredService<IConclaveCardanoService>();

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