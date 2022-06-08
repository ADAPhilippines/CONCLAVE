using Conclave.Api.Interfaces;
using Conclave.Api.Options;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Microsoft.Extensions.Options;

namespace Conclave.Snapshot.Handlers;

public class NFTRewardHandler
{

    private readonly IConclaveRewardService _rewardService;
    private readonly IConclaveEpochsService _epochService;
    private readonly INFTRewardService _nftRewardService;
    private readonly INFTSnapshotService _nftSnapshotService;
    private readonly IOptions<RewardOptions> _options;

    public NFTRewardHandler(IConclaveRewardService rewardService,
                            IConclaveEpochsService epochsService,
                            INFTRewardService nftRewardService,
                            INFTSnapshotService nftSnapshotService,
                            IOptions<RewardOptions> options)
    {
        _rewardService = rewardService;
        _epochService = epochsService;
        _nftRewardService = nftRewardService;
        _nftSnapshotService = nftSnapshotService;
        _options = options;
    }


    public async Task HandleAsync(ConclaveEpoch epoch)
    {
        if (epoch.NFTSnapshotStatus != SnapshotStatus.Completed) return;
        if (epoch.NFTRewardStatus == RewardStatus.Completed) return;

        // fetch all NFT snapshots
        var nftSnapshots = _nftSnapshotService.GetAllByEpochNumber(epoch.EpochNumber);

        if (nftSnapshots is null) return;

        // Update reward status
        epoch.NFTRewardStatus = RewardStatus.InProgress;
        await _epochService.UpdateAsync(epoch.Id, epoch);

        // Get total reward for this epoch
        //var totalEpochReward = epoch.TotalConclaveReward;
        var totalEpochReward = _options.Value.ConclaveTokenAirdropSupply / _options.Value.ConclaveAirdropEpochsCount;
        var nftShare = totalEpochReward * (_options.Value.NFTPercentage / 100.0);

        // Calculate delegator rewars
        var nftRewards = _rewardService.CalculateNFTRewardsAsync(nftSnapshots, nftShare);

        foreach (var nftReward in nftRewards) await _nftRewardService.CreateAsync(nftReward);

        // Update reward status
        epoch.NFTRewardStatus = RewardStatus.Completed;
        await _epochService.UpdateAsync(epoch.Id, epoch);
    }
}