using Conclave.Api.Interfaces;
using Conclave.Api.Options;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Microsoft.Extensions.Options;

namespace Conclave.Snapshot.Handlers;

public class OperatorSnapshotHandler
{
    private readonly IConclaveSnapshotService _snapshotService;
    private readonly IOperatorSnapshotService _operatorSnapshotService;
    private readonly IConclaveEpochsService _epochsService;
    private readonly IDelegatorSnapshotService _delegatorSnapshotService;
    private readonly IOptions<ConclaveOptions> _options;

    public OperatorSnapshotHandler(IConclaveSnapshotService snapshotService,
                                   IOperatorSnapshotService operatorSnapshotService,
                                   IConclaveEpochsService epochsService,
                                   IDelegatorSnapshotService delegatorSnapshotService,
                                   IOptions<ConclaveOptions> options)
    {
        _snapshotService = snapshotService;
        _operatorSnapshotService = operatorSnapshotService;
        _epochsService = epochsService;
        _delegatorSnapshotService = delegatorSnapshotService;
        _options = options;
    }

    public async Task HandleAsync(ConclaveEpoch epoch)
    {
        if (epoch.OperatorSnapshotStatus == SnapshotStatus.Completed) return;

        // Update status to InProgress
        epoch.OperatorSnapshotStatus = SnapshotStatus.InProgress;
        await _epochsService.UpdateAsync(epoch.Id, epoch);

        // Snapshot current operators for all the conclave pools
        var operatorSnapshots = await _snapshotService.SnapshotOperatorsAsync(_options.Value.PoolIds, epoch);

        // Save the snapshot to database
        foreach (var operatorSnapshot in operatorSnapshots)
        {
            await _operatorSnapshotService.CreateAsync(operatorSnapshot);
            await _delegatorSnapshotService.CreateAsync(new DelegatorSnapshot()
            {
                ConclaveEpoch = epoch,
                StakeAddress = operatorSnapshot.StakeAddress,
                WalletAddress = operatorSnapshot.WalletAddress,
                PoolAddress = operatorSnapshot.PoolAddress,
                Quantity = operatorSnapshot.Pledge,
            });
        }

        // Update status to Completed
        epoch.OperatorSnapshotStatus = SnapshotStatus.Completed;
        await _epochsService.UpdateAsync(epoch.Id, epoch);
    }
}