using Conclave.Api.Interfaces;
using Conclave.Api.Options;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Microsoft.Extensions.Options;

namespace Conclave.Snapshot.Handlers;

public class DelegatorSnapshotHandler
{
    private readonly IConclaveSnapshotService _snapshotService;
    private readonly IDelegatorSnapshotService _delegatorSnapshotService;
    private readonly IConclaveEpochsService _epochsService;
    private readonly IOptions<ConclaveOptions> _options;

    public DelegatorSnapshotHandler(IConclaveSnapshotService snapshotService,
                                    IDelegatorSnapshotService delegatorSnapshotService,
                                    IConclaveEpochsService epochsService,
                                    IOptions<ConclaveOptions> options)
    {
        _snapshotService = snapshotService;
        _delegatorSnapshotService = delegatorSnapshotService;
        _epochsService = epochsService;
        _options = options;
    }

    public async Task HandleAsync(ConclaveEpoch epoch)
    {
        if (epoch.DelegatorSnapshotStatus == SnapshotStatus.Completed) return;

        // Update status to InProgress
        epoch.DelegatorSnapshotStatus = SnapshotStatus.InProgress;
        await _epochsService.UpdateAsync(epoch.Id, epoch);

        // Snapshot current delegators for all the conclave pools
        var delegatorSnapshots = await _snapshotService.SnapshotDelegatorsAsync(_options.Value.PoolIds, epoch);

        // Save the snapshot to database
        foreach (var delegatorSnapshot in delegatorSnapshots) await _delegatorSnapshotService.CreateAsync(delegatorSnapshot);

        // Update status to Completed
        epoch.DelegatorSnapshotStatus = SnapshotStatus.Completed;
        await _epochsService.UpdateAsync(epoch.Id, epoch);
    }
}