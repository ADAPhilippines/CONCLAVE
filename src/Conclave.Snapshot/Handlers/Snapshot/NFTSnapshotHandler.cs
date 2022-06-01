using Conclave.Api.Interfaces;
using Conclave.Api.Options;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Conclave.Common.Utils;
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

        if (nftGroups.Count() is 0 || delegators.Count() is 0)
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

            if (nftProjects.Count() is 0) continue;

            var partialNFTSnapshots = await _snapshotService.SnapshotNFTsForStakeAddressesAsync(nftProjects, delegators, epoch);

            if (partialNFTSnapshots.Count() is 0) continue;

            nftSnapshots.AddRange(partialNFTSnapshots);
        }

        // Save the snapshot to database
        foreach (var nftSnapshot in nftSnapshots) await _nftSnapshotService.CreateAsync(nftSnapshot);

        // Update status to Completed
        epoch.NFTSnapshotStatus = SnapshotStatus.Completed;
        await _epochsService.UpdateAsync(epoch.Id, epoch);
    }
}