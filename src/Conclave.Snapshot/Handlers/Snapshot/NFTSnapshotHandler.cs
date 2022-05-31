using Conclave.Api.Interfaces;
using Conclave.Api.Options;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Microsoft.Extensions.Options;

namespace Conclave.Snapshot.Handlers;

public class NFTSnapshotHandler
{
    private readonly IConclaveSnapshotService _snapshotService;
    private readonly INFTSnapshotService _nftSnapshotService;
    private readonly IConclaveEpochsService _epochsService;
    private readonly INFTGroupService _nftGroupService;
    private readonly INFTProjectService _nftProjectService;
    private readonly IDelegatorSnapshotService _delegatorSnapshotService;
    private readonly IOptions<ConclaveOptions> _options;

    public NFTSnapshotHandler(IConclaveSnapshotService snapshotService,
                              INFTSnapshotService nftSnapshotService,
                              IConclaveEpochsService epochsService,
                              INFTGroupService nftGroupService,
                              INFTProjectService nftProjectService,
                              IDelegatorSnapshotService delegatorSnapshotService,
                              IOptions<ConclaveOptions> options)
    {
        _snapshotService = snapshotService;
        _nftSnapshotService = nftSnapshotService;
        _epochsService = epochsService;
        _nftGroupService = nftGroupService;
        _nftProjectService = nftProjectService;
        _delegatorSnapshotService = delegatorSnapshotService;
        _options = options;
    }

    public async Task HandleAsync(ConclaveEpoch epoch)
    {
        if (epoch.NFTSnapshotStatus == SnapshotStatus.Completed) return;

        // Update status to InProgress
        epoch.NFTSnapshotStatus = SnapshotStatus.InProgress;
        await _epochsService.UpdateAsync(epoch.Id, epoch);

        // Fetch NFT Groups
        var nftGroups = _nftGroupService.GetAll();
        var delegators = _delegatorSnapshotService.GetAllByEpochNumber(epoch.EpochNumber);

        if (nftGroups is null || delegators is null)
        {
            epoch.NFTSnapshotStatus = SnapshotStatus.Completed;
            await _epochsService.UpdateAsync(epoch.Id, epoch);
            return;
        }

        var nftSnapshots = new List<NFTSnapshot>();

        // Snapshot current NFTs for all the nft groups
        foreach (var nftGroup in nftGroups)
        {
            var nftProjects = _nftProjectService.GetAllByNFTGroup(nftGroup.Id);

            if (nftProjects is null) continue;

            var partialNFTSnapshots = await SnapshotInParallel(nftProjects, delegators, epoch);

            nftSnapshots.AddRange(partialNFTSnapshots);
        }

        // Save the snapshot to database
        foreach (var nftSnapshot in nftSnapshots) await _nftSnapshotService.CreateAsync(nftSnapshot);

        // Update status to Completed
        epoch.NFTSnapshotStatus = SnapshotStatus.Completed;
        await _epochsService.UpdateAsync(epoch.Id, epoch);
    }

    private async Task<IEnumerable<NFTSnapshot>> SnapshotInParallel(IEnumerable<NFTProject> nftProjects,
                                                                    IEnumerable<DelegatorSnapshot> delegators,
                                                                    ConclaveEpoch epoch,
                                                                    int threadCount = 50)
    {
        int delegatorCountPerThread = (int)Math.Ceiling((double)delegators.Count() / threadCount);

        if (delegators.Count() < 20)
            return await _snapshotService.SnapshotNFTsForStakeAddressesAsync(nftProjects, delegators, epoch);

        var partialDelegators = Enumerable.Range(0, threadCount).Aggregate(new List<List<DelegatorSnapshot>>(), (list, i) =>
        {
            if (i == 0) list.Add(delegators.Take(delegatorCountPerThread).ToList());
            else list.Add(delegators.Skip(delegatorCountPerThread * i).Take(delegatorCountPerThread).ToList());

            return list;
        });

        var partialNFTSnapshots = Enumerable.Range(0, threadCount).Aggregate(new List<Task<IEnumerable<NFTSnapshot>>>(), (current, i) =>
        {
            current.Add(_snapshotService.SnapshotNFTsForStakeAddressesAsync(nftProjects, partialDelegators[i], epoch));
            return current;
        });

        var partialSnapshots = await Task.WhenAll(partialNFTSnapshots);

        var nftSnapshots = partialSnapshots.Aggregate(new List<NFTSnapshot>(), (current, partialSnapshot) =>
        {
            current.AddRange(partialSnapshot);
            return current;
        });

        return nftSnapshots;
    }
}