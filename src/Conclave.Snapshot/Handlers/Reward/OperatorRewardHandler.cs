using Conclave.Api.Interfaces;
using Conclave.Api.Options;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Microsoft.Extensions.Options;

namespace Conclave.Snapshot.Handlers;

public class OperatorRewardHandler
{

    private readonly IConclaveRewardService _rewardService;
    private readonly IConclaveEpochsService _epochService;
    private readonly IOperatorRewardService _operatorRewardService;
    private readonly IOperatorSnapshotService _operatorSnapshotService;
    private readonly IOptions<RewardOptions> _options;

    public OperatorRewardHandler(IConclaveRewardService rewardService,
                                 IConclaveEpochsService epochsService,
                                 IOperatorRewardService operatorRewardService,
                                 IOperatorSnapshotService operatorSnapshotService,
                                 IOptions<RewardOptions> options)
    {
        _rewardService = rewardService;
        _epochService = epochsService;
        _operatorRewardService = operatorRewardService;
        _operatorSnapshotService = operatorSnapshotService;
        _options = options;
    }


    public async Task HandleAsync(ConclaveEpoch epoch)
    {
        if (epoch.OperatorSnapshotStatus != SnapshotStatus.Completed) return;
        if (epoch.OperatorRewardStatus == RewardStatus.Completed) return;

        var operatorSnapshots = _operatorSnapshotService.GetAllByEpochNumber(epoch.EpochNumber);

        if (operatorSnapshots is null) return;

        // Update reward status
        epoch.OperatorRewardStatus = RewardStatus.InProgress;
        await _epochService.UpdateAsync(epoch.Id, epoch);

        // Get total reward for this epoch
        var totalEpochReward = _options.Value.ConclaveTokenAirdropSupply / _options.Value.ConclaveAirdropEpochsCount;
        var operatorShare = totalEpochReward * (_options.Value.OperatorPercentage / 100.0);

        // Calculate delegator rewars
        var operatorRewards = _rewardService.CalculateOperatorRewardsAsync(operatorSnapshots, operatorShare);

        foreach (var operatorReward in operatorRewards) await _operatorRewardService.CreateAsync(operatorReward);

        // Update reward status
        epoch.OperatorRewardStatus = RewardStatus.Completed;
        await _epochService.UpdateAsync(epoch.Id, epoch);
    }

    private async Task PrepareAirdrop()
    {

    }
}