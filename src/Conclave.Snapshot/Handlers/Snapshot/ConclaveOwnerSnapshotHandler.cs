using Conclave.Api.Interfaces;
using Conclave.Api.Options;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Conclave.Common.Utils;
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
        epoch.DateUpdated = DateUtils.DateTimeToUtc(DateTime.Now);
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
        var conclaveOwnerSnapshots = await SnapshotInParallelAsync(_options.Value.ConclaveAddress, delegators, epoch);

        // Save the snapshot to database
        foreach (var conclaveOwnerSnapshot in conclaveOwnerSnapshots) await _conclaveOwnerSnapshotService.CreateAsync(conclaveOwnerSnapshot);

        // Update status to Completed
        epoch.ConclaveOwnerSnapshotStatus = SnapshotStatus.Completed;
        await _epochsService.UpdateAsync(epoch.Id, epoch);
    }


    private async Task<IEnumerable<ConclaveOwnerSnapshot>> SnapshotInParallelAsync(string conclavePolicyId,
                                                                               IEnumerable<DelegatorSnapshot> delegators,
                                                                               ConclaveEpoch epoch,
                                                                               int threadCount = 50)
    {

        var delegatorCountPerThread = (int)Math.Ceiling((double)delegators.Count() / threadCount);

        if (delegators.Count() < 20)
            return await _snapshotService.SnapshotConclaveOwnersAsync(conclavePolicyId, delegators, epoch);

        // Split the delegators into chunks
        var partialDelegators = Enumerable.Range(0, threadCount).Aggregate(new List<List<DelegatorSnapshot>>(), (list, i) =>
        {
            if (i == 0) list.Add(delegators.Take(delegatorCountPerThread).ToList());
            else list.Add(delegators.Skip(delegatorCountPerThread * i).Take(delegatorCountPerThread).ToList());

            return list;
        });

        // Snapshot the delegators in parallel
        var partialConclaveOwnerSnapshots = Enumerable.Range(0, threadCount).Aggregate(new List<Task<IEnumerable<ConclaveOwnerSnapshot>>>(), (current, i) =>
        {
            current.Add(_snapshotService.SnapshotConclaveOwnersAsync(conclavePolicyId, partialDelegators[i], epoch));
            return current;
        });

        // Wait for all the tasks to complete
        var partialSnapshots = await Task.WhenAll(partialConclaveOwnerSnapshots);

        // concatenate list of snapshots
        var conclaveOwnerSnapshots = partialSnapshots.Aggregate(new List<ConclaveOwnerSnapshot>(), (current, partialSnapshot) =>
        {
            current.AddRange(partialSnapshot);
            return current;
        });

        return conclaveOwnerSnapshots;
    }
}