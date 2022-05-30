using Conclave.Api.Interfaces;
using Conclave.Api.Options;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Microsoft.Extensions.Options;

namespace Conclave.Snapshot.Handlers;

public class ConclaveOwnerSnapshotHandler
{
    private readonly IConclaveSnapshotService _snapshotService;
    private readonly IConclaveOwnerSnapshotService _conclaveOwnerSnapshotService;
    private readonly IDelegatorSnapshotService _delegatorSnapshotService;
    private readonly IConclaveEpochsService _epochsService;
    private readonly IOptions<ConclaveOptions> _options;

    public ConclaveOwnerSnapshotHandler(IConclaveSnapshotService snapshotService,
                                        IConclaveOwnerSnapshotService conclaveOwnerSnapshotService,
                                        IDelegatorSnapshotService delegatorSnapshotService,
                                        IConclaveEpochsService epochsService,
                                        IOptions<ConclaveOptions> options)
    {
        _snapshotService = snapshotService;
        _conclaveOwnerSnapshotService = conclaveOwnerSnapshotService;
        _delegatorSnapshotService = delegatorSnapshotService;
        _epochsService = epochsService;
        _options = options;
    }

    public async Task HandleAsync(ConclaveEpoch epoch)
    {
        if (epoch.ConclaveOwnerSnapshotStatus == SnapshotStatus.Completed) return;

        // Update status to InProgress
        epoch.ConclaveOwnerSnapshotStatus = SnapshotStatus.InProgress;
        await _epochsService.UpdateAsync(epoch.Id, epoch);

        // Get all delegators
        var delegators = _delegatorSnapshotService.GetAllByEpochNumber(epoch.EpochNumber);

        if (delegators is null)
        {
            epoch.ConclaveOwnerSnapshotStatus = SnapshotStatus.Completed;
            await _epochsService.UpdateAsync(epoch.Id, epoch);
            return;
        }

        // Snapshot current conclave owners for all the conclave pools
        var conclaveOwnerSnapshots = await _snapshotService.SnapshotConclaveOwnersAsync(_options.Value.ConclaveAddress,
                                                                                       delegators,
                                                                                       epoch);

        // Save the snapshot to database
        foreach (var conclaveOwnerSnapshot in conclaveOwnerSnapshots) await _conclaveOwnerSnapshotService.CreateAsync(conclaveOwnerSnapshot);

        // Update status to Completed
        epoch.ConclaveOwnerSnapshotStatus = SnapshotStatus.Completed;
        await _epochsService.UpdateAsync(epoch.Id, epoch);
    }
}