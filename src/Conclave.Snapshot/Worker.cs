using Conclave.Api.Interfaces;
using Conclave.Api.Options;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Conclave.Snapshot.Handlers;
using Microsoft.Extensions.Options;

namespace Conclave.Snapshot;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private ConclaveEpoch? SeedEpoch { get; set; }
    private ConclaveEpoch? CurrentConclaveEpoch { get; set; }
    private ConclaveEpoch? NewConclaveEpoch { get; set; }

    // services

    private IConclaveEpochsService EpochsService { get; set; }
    private IConclaveCardanoService CardanoService { get; set; }
    private IConclaveSchedulerService SnapshotSchedulerService { get; set; }

    // Snapshot Handlers
    private DelegatorSnapshotHandler DelegatorSnapshotHandler { get; }
    private OperatorSnapshotHandler OperatorSnapshotHandler { get; }
    private NFTSnapshotHandler NftSnapshotHandler { get; }
    private ConclaveOwnerSnapshotHandler OwnerSnapshotHandler { get; }

    // Reward Handlers
    private DelegatorRewardHandler DelegatorRewardHandler { get; }
    private OperatorRewardHandler OperatorRewardHandler { get; }
    private NFTRewardHandler NftRewardHandler { get; }
    private ConclaveOwnerRewardHandler ConcalveOwnerRewardHandler { get; }

    // options
    private SnapshotOptions SnapshotOptions { get; }
    private ApplicationOptions ApplicationOptions { get; }


    public Worker(ILogger<Worker> logger, IServiceProvider provider)
    {
        _logger = logger;
        var scopedProvider = provider.CreateScope().ServiceProvider;

        // Snapshot
        DelegatorSnapshotHandler = scopedProvider.GetRequiredService<DelegatorSnapshotHandler>();
        OperatorSnapshotHandler = scopedProvider.GetRequiredService<OperatorSnapshotHandler>();
        NftSnapshotHandler = scopedProvider.GetRequiredService<NFTSnapshotHandler>();
        OwnerSnapshotHandler = scopedProvider.GetRequiredService<ConclaveOwnerSnapshotHandler>();

        // Reward
        DelegatorRewardHandler = scopedProvider.GetRequiredService<DelegatorRewardHandler>();
        OperatorRewardHandler = scopedProvider.GetRequiredService<OperatorRewardHandler>();
        NftRewardHandler = scopedProvider.GetRequiredService<NFTRewardHandler>();
        ConcalveOwnerRewardHandler = scopedProvider.GetRequiredService<ConclaveOwnerRewardHandler>();

        // services
        EpochsService = scopedProvider.GetService<IConclaveEpochsService>()!;
        CardanoService = scopedProvider.GetService<IConclaveCardanoService>()!;
        SnapshotSchedulerService = scopedProvider.GetService<IConclaveSchedulerService>()!;

        //options
        SnapshotOptions = scopedProvider.GetService<IOptions<SnapshotOptions>>()!.Value;
        ApplicationOptions = scopedProvider.GetService<IOptions<ApplicationOptions>>()!.Value;

    }
    protected async override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // TODO: check for blockfrost health status before proceeding

                // Prepare snapshot
                await ExecuteSeedEpochGetterOrSetterAsync();
                await ExecuteCurrentEpochGetterOrSetterAsync();

                // Scheduler
                if (!ApplicationOptions.IsDevelopment) await ExecuteSnapshotSchedulerAsync();

                await ExecuteNewEpochGetterOrSetterAsync();

                if (NewConclaveEpoch is null)
                {
                    await Task.Delay(60 * 5 * 1000, stoppingToken);
                    return;
                } // 5 minutes

                // snapshot
                await DelegatorSnapshotHandler.HandleAsync(NewConclaveEpoch);
                await OperatorSnapshotHandler.HandleAsync(NewConclaveEpoch);
                await NftSnapshotHandler.HandleAsync(NewConclaveEpoch);
                await OwnerSnapshotHandler.HandleAsync(NewConclaveEpoch);

                // reward
                await DelegatorRewardHandler.HandleAsync(NewConclaveEpoch);
                await OperatorRewardHandler.HandleAsync(NewConclaveEpoch);
                await NftRewardHandler.HandleAsync(NewConclaveEpoch);
                await ConcalveOwnerRewardHandler.HandleAsync();

                // end conclave epoch cycle
                await ExecuteSnapshotEndSchedulerAsync();
            }
            catch (Exception e)
            {
                _logger.LogCritical(e, "Critical error in worker");
                await Task.Delay(36000000, stoppingToken); // sleep for 1 hour
            }
        }
    }

    private async Task ExecuteSeedEpochGetterOrSetterAsync()
    {
        _logger.LogInformation("Executing SeedEpochGetterOrSetterAsync");

        if (SeedEpoch is not null) return;

        SeedEpoch = EpochsService!.GetByEpochStatus(EpochStatus.Seed).FirstOrDefault();

        if (SeedEpoch is not null) return;

        var currentEpoch = await CardanoService!.GetCurrentEpochAsync();
        SeedEpoch = await EpochsService.CreateAsync(new ConclaveEpoch
        {
            EpochNumber = currentEpoch.Number,
            StartTime = currentEpoch.StartTime,
            EndTime = currentEpoch.EndTime,
            EpochStatus = EpochStatus.Seed,
            DelegatorSnapshotStatus = SnapshotStatus.Skip,
            OperatorSnapshotStatus = SnapshotStatus.Skip,
            NFTSnapshotStatus = SnapshotStatus.Skip,
            DelegatorRewardStatus = RewardStatus.Skip,
            OperatorRewardStatus = RewardStatus.Skip,
            NFTRewardStatus = RewardStatus.Skip,
            ConclaveOwnerRewardStatus = RewardStatus.Skip
        });

        _logger.LogInformation("Exiting SeedEpochGetterOrSetterAsync");
    }

    private async Task ExecuteCurrentEpochGetterOrSetterAsync()
    {
        _logger.LogInformation("Executing CurrentEpochGetterAsync");

        if (CurrentConclaveEpoch is not null) return;

        CurrentConclaveEpoch = EpochsService!.GetByEpochStatus(EpochStatus.Current).FirstOrDefault() ?? SeedEpoch;

        await Task.Delay(1);

        _logger.LogInformation("Exiting CurrentEpochGetterAsync");
    }

    private async Task ExecuteSnapshotSchedulerAsync()
    {
        _logger.LogInformation($"Executing SnapshotSchedulerAsync");

        var delayInMilliseconds = 0L;

        do
        {
            delayInMilliseconds = SnapshotSchedulerService!.GetSnapshotDelayInMilliseconds(CurrentConclaveEpoch!,
                                                                                           SnapshotOptions!.SnapshotBeforeMilliseconds);
            _logger.LogInformation($"Conclave Epoch snapshot cycle will start in {DateUtils.GetReadableTimeFromMilliseconds((int)delayInMilliseconds)}");
            await Task.Delay(5000);
        } while (delayInMilliseconds > 0);

        _logger.LogInformation($"Exiting SnapshotSchedulerAsync");
    }

    private async Task ExecuteNewEpochGetterOrSetterAsync()
    {
        _logger.LogInformation("Executing NewEpochGetterOrSetterAsync");

        if (NewConclaveEpoch is not null) return;

        NewConclaveEpoch = EpochsService!.GetByEpochStatus(EpochStatus.New).FirstOrDefault();

        if (NewConclaveEpoch is not null) return;

        NewConclaveEpoch = await EpochsService.CreateAsync(new ConclaveEpoch
        {
            EpochNumber = CurrentConclaveEpoch!.EpochNumber + 1,
        });
    }

    private async Task ExecuteSnapshotEndSchedulerAsync()
    {
        _logger.LogInformation("Executing SnapshotCycleWrapperAsync");

        var delayInMilliseconds = 0L;

        do
        {
            delayInMilliseconds = SnapshotSchedulerService!.GetNewEpochCreationDelayInMilliseconds(CurrentConclaveEpoch!,
                                                                       SnapshotOptions!.SnapshotCompleteAfterMilliseconds);
            _logger.LogInformation($"Conclave Epoch will end after {DateUtils.GetReadableTimeFromMilliseconds((int)delayInMilliseconds)}");
            await Task.Delay(5000);
        } while (delayInMilliseconds > 0);

        while (NewConclaveEpoch is not null)
        {

            var currentEpoch = await CardanoService!.GetCurrentEpochAsync();

            if (currentEpoch.Number != NewConclaveEpoch.EpochNumber)
            {
                // try again after 5 minutes
                _logger.LogInformation("New epoch is not current, waiting 5 minutes");
                await Task.Delay(60 * 5 * 1000);
                continue;
            }

            // update new epoch status
            NewConclaveEpoch.StartTime = currentEpoch.StartTime;
            NewConclaveEpoch.EndTime = currentEpoch.EndTime;
            NewConclaveEpoch.EpochStatus = EpochStatus.Current;

            await EpochsService!.UpdateAsync(NewConclaveEpoch.Id, NewConclaveEpoch);

            //should be on top of new epoch instead of below
            if (CurrentConclaveEpoch!.EpochStatus != EpochStatus.Seed)
            {
                // Update epoch status to Old
                CurrentConclaveEpoch.EpochStatus = EpochStatus.Old;
                await EpochsService!.UpdateAsync(CurrentConclaveEpoch.Id, CurrentConclaveEpoch);
            }

            // Update worker epoch properties
            CurrentConclaveEpoch = NewConclaveEpoch;
            NewConclaveEpoch = null;
        }

        _logger.LogInformation("Exiting SnapshotCycleWrapperAsync");
    }
}