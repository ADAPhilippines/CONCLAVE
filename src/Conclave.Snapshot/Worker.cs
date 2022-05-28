using Conclave.Api.Interfaces;
using Conclave.Api.Options;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Conclave.Common.Utils;
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
    private IConclaveSnapshotService SnapshotService { get; set; }
    private IDelegatorSnapshotService DelegatorSnapshotService { get; set; }
    private IOperatorSnapshotService OperatorSnapshotService { get; set; }
    private IConclaveOwnerSnapshotService ConclaveOwnerSnapshotService { get; set; }
    private IConclaveSnapshotSchedulerService SnapshotSchedulerService { get; set; }


    // private IConclaveEpochDelegatorService? EpochDelegatorService { get; set; }
    // private IConclaveEpochDelegatorWorkerService? EpochDelegatorWorkerService { get; set; }
    // private IConclaveSnapshotWorkerService? SnapshotWorkerService { get; set; }

    // options

    private IOptions<ConclaveOptions> ConclaveOptions { get; set; }
    private IOptions<SnapshotOptions> SnapshotOptions { get; set; }


    public Worker(ILogger<Worker> logger, IServiceProvider provider)
    {
        _logger = logger;
        var scopedProvider = provider.CreateScope().ServiceProvider;

        // services
        EpochsService = scopedProvider.GetService<IConclaveEpochsService>()!;
        CardanoService = scopedProvider.GetService<IConclaveCardanoService>()!;
        SnapshotService = scopedProvider.GetService<IConclaveSnapshotService>()!;
        DelegatorSnapshotService = scopedProvider.GetService<IDelegatorSnapshotService>()!;
        OperatorSnapshotService = scopedProvider.GetService<IOperatorSnapshotService>()!;
        SnapshotSchedulerService = scopedProvider.GetService<IConclaveSnapshotSchedulerService>()!;
        ConclaveOwnerSnapshotService = scopedProvider.GetService<IConclaveOwnerSnapshotService>()!;

        // EpochDelegatorService = scopedProvider.GetService<IConclaveEpochDelegatorService>();
        // EpochDelegatorWorkerService = scopedProvider.GetService<IConclaveEpochDelegatorWorkerService>();
        // SnapshotWorkerService = scopedProvider.GetService<IConclaveSnapshotWorkerService>();

        //options
        ConclaveOptions = scopedProvider.GetService<IOptions<ConclaveOptions>>()!;
        SnapshotOptions = scopedProvider.GetService<IOptions<SnapshotOptions>>()!;

    }
    protected async override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ExecuteSeedEpochGetterOrSetterAsync();
                await ExecuteCurrentEpochGetterOrSetterAsync();
                // await ExecuteSnapshotSchedulerAsync(); // skipped for testing
                await ExecuteNewEpochGetterOrSetterAsync();
                await ExecuteDelegatorSnapshotAsync();
                await ExecuteOperatorSnapshotAsync();
                await ExecuteConclaveOwnerSnapshotAsync();
                await ExecuteSnapshotEndSchedulerAsync();

            }
            catch (Exception e)
            {
                _logger.LogCritical(e.Message);
                await Task.Delay(36000000, stoppingToken); // wait 
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
            AirdropStatus = AirdropStatus.Skip,
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

        var delayInMilliseconds = SnapshotSchedulerService!.GetSnapshotDelayInMilliseconds(CurrentConclaveEpoch!,
                                                                                           SnapshotOptions!.Value.SnapshotBeforeMilliseconds);

        if (delayInMilliseconds < 1) return;

        _logger.LogInformation($"Snapshot will execute after {DateUtils.GetReadableTimeFromMilliseconds((int)delayInMilliseconds)}");

        await Task.Delay((int)delayInMilliseconds);

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
            StartTime = DateUtils.DateTimeToUtc(DateTime.Now),
            EndTime = DateUtils.DateTimeToUtc(DateTime.Now),
            EpochStatus = EpochStatus.New,
            DelegatorSnapshotStatus = SnapshotStatus.New,
            OperatorSnapshotStatus = SnapshotStatus.New,
            ConclaveOwnerSnapshotStatus = SnapshotStatus.New,
            NFTSnapshotStatus = SnapshotStatus.New,
            AirdropStatus = AirdropStatus.New
        });
    }

    private async Task ExecuteDelegatorSnapshotAsync()
    {
        _logger.LogInformation("Executing DelegatorSnapshotAsync");

        if (NewConclaveEpoch!.DelegatorSnapshotStatus == SnapshotStatus.Completed) return;

        // Update status to InProgress
        NewConclaveEpoch.DelegatorSnapshotStatus = SnapshotStatus.InProgress;
        await EpochsService.UpdateAsync(NewConclaveEpoch.Id, NewConclaveEpoch);

        // Snapshot current delegators for all the conclave pools
        var delegatorSnapshots = await SnapshotService!.SnapshotDelegatorsAsync(ConclaveOptions!.Value.PoolIds, NewConclaveEpoch);

        // Save the snapshot to database
        foreach (var delegatorSnapshot in delegatorSnapshots) await DelegatorSnapshotService!.CreateAsync(delegatorSnapshot);

        // Update status to Completed
        NewConclaveEpoch.DelegatorSnapshotStatus = SnapshotStatus.Completed;
        await EpochsService!.UpdateAsync(NewConclaveEpoch.Id, NewConclaveEpoch);

        _logger.LogInformation("Exiting DelegatorSnapshotAsync");
    }

    private async Task ExecuteOperatorSnapshotAsync()
    {
        _logger.LogInformation("Executing OperatorSnapshotAsync");

        if (NewConclaveEpoch.OperatorSnapshotStatus == SnapshotStatus.Completed) return;

        // Update status to InProgress
        NewConclaveEpoch.OperatorSnapshotStatus = SnapshotStatus.InProgress;
        await EpochsService.UpdateAsync(NewConclaveEpoch.Id, NewConclaveEpoch);

        // Snapshot current operators for all the conclave pools
        var operatorSnapshots = await SnapshotService!.SnapshotOperatorsAsync(ConclaveOptions.Value.PoolIds, NewConclaveEpoch);

        // Save the snapshot to database
        foreach (var operatorSnapshot in operatorSnapshots) await OperatorSnapshotService.CreateAsync(operatorSnapshot);

        // Update status to Completed
        NewConclaveEpoch.OperatorSnapshotStatus = SnapshotStatus.Completed;
        await EpochsService.UpdateAsync(NewConclaveEpoch.Id, NewConclaveEpoch);

        _logger.LogInformation("Exiting OperatorSnapshotAsync");
    }

    private async Task ExecuteConclaveOwnerSnapshotAsync()
    {
        _logger.LogInformation("Executing ConclaveOwnerSnapshotAsync");

        if (NewConclaveEpoch!.ConclaveOwnerSnapshotStatus == SnapshotStatus.Completed) return;

        // Update status to InProgress
        NewConclaveEpoch.ConclaveOwnerSnapshotStatus = SnapshotStatus.InProgress;
        await EpochsService.UpdateAsync(NewConclaveEpoch.Id, NewConclaveEpoch);

        // Get all delegators
        var delegators = DelegatorSnapshotService!.GetAllByEpochNumber(NewConclaveEpoch.EpochNumber);

        if (delegators is null)
        {
            NewConclaveEpoch.ConclaveOwnerSnapshotStatus = SnapshotStatus.Completed;
            await EpochsService!.UpdateAsync(NewConclaveEpoch.Id, NewConclaveEpoch);
            return;
        }

        // Snapshot current conclave owners for all the conclave pools
        var conclaveOwnerSnapshots = await SnapshotService!.SnapshotConclaveOwnersAsync(ConclaveOptions.Value.ConclaveAddress,
                                                                                        delegators,
                                                                                        NewConclaveEpoch);

        // Save the snapshot to database
        foreach (var conclaveOwnerSnapshot in conclaveOwnerSnapshots) await ConclaveOwnerSnapshotService!.CreateAsync(conclaveOwnerSnapshot);

        // Update status to Completed
        NewConclaveEpoch.ConclaveOwnerSnapshotStatus = SnapshotStatus.Completed;
        await EpochsService!.UpdateAsync(NewConclaveEpoch.Id, NewConclaveEpoch);

        _logger.LogInformation("Exiting ConclaveOwnerSnapshotAsync");
    }

    private async Task ExecuteSnapshotEndSchedulerAsync()
    {
        _logger.LogInformation("Executing SnapshotCycleWrapperAsync");

        var delayInMilliseconds = SnapshotSchedulerService!.GetNewEpochCreationDelayInMilliseconds(CurrentConclaveEpoch!,
                                                                                           SnapshotOptions!.Value.SnapshotCompleteAfterMilliseconds);

        _logger.LogInformation($"Snapshot will end after {DateUtils.GetReadableTimeFromMilliseconds((int)delayInMilliseconds)}");

        await Task.Delay((int)delayInMilliseconds);

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