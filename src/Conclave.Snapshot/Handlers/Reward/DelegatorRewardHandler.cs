using Conclave.Api.Interfaces;
using Conclave.Api.Options;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Microsoft.Extensions.Options;

namespace Conclave.Snapshot.Handlers;

public class DelegatorRewardHandler
{

    private readonly IConclaveRewardService _rewardService;
    private readonly IConclaveEpochsService _epochService;
    private readonly IDelegatorRewardService _delegatorRewardService;
    private readonly IDelegatorSnapshotService _delegatorSnapshotService;
    private readonly IOptions<RewardOptions> _options;

    public DelegatorRewardHandler(IConclaveRewardService rewardService,
                                  IConclaveEpochsService epochsService,
                                  IDelegatorRewardService delegatorRewardService,
                                  IDelegatorSnapshotService delegatorSnapshotService,
                                  IOptions<RewardOptions> options)
    {
        _rewardService = rewardService;
        _epochService = epochsService;
        _delegatorRewardService = delegatorRewardService;
        _delegatorSnapshotService = delegatorSnapshotService;
        _options = options;
    }


    public async Task HandleAsync(ConclaveEpoch epoch)
    {
        if (epoch.DelegatorSnapshotStatus != SnapshotStatus.Completed) return;
        if (epoch.DelegatorRewardStatus == RewardStatus.Completed) return;

        // Fetch all snapshots
        var delegatorSnapshots = _delegatorSnapshotService.GetAllByEpochNumber(epoch.EpochNumber) ?? new List<DelegatorSnapshot>();

        // Update reward status
        epoch.DelegatorRewardStatus = RewardStatus.InProgress;
        await _epochService.UpdateAsync(epoch.Id, epoch);

        // Get total reward for this epoch
        var totalEpochReward = _options.Value.ConclaveTokenAirdropSupply / _options.Value.ConclaveAirdropEpochsCount;
        var delegatorShare = totalEpochReward * (_options.Value.DelegatorPercentage / 100.0);

        // Calculate delegator rewards
        var delegatorRewards = _rewardService.CalculateDelegatorRewardsAsync(delegatorSnapshots, delegatorShare);

        foreach (var delegatorReward in delegatorRewards) await _delegatorRewardService.CreateAsync(delegatorReward);

        // Update reward status
        epoch.DelegatorRewardStatus = RewardStatus.Completed;
        await _epochService.UpdateAsync(epoch.Id, epoch);
    }
}