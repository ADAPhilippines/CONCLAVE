using Conclave.Api.Interfaces;
using Conclave.Api.Options;
using Conclave.Api.Services;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Microsoft.Extensions.Options;

namespace Conclave.Snapshot.Handlers;

public class ConclaveOwnerRewardHandler
{
    private readonly ILogger<Worker> _logger;
    private readonly IConclaveRewardService _rewardService;
    private readonly IConclaveEpochsService _epochService;
    private readonly IConclaveOwnerRewardService _conclaveOwnerRewardService;
    private readonly IConclaveOwnerSnapshotService _conclaveOwnerSnapshotService;
    private IConclaveSchedulerService ConclaveOwnerScheduler { get; set; }
    private IOptions<PoolOwnerRewardOptions> PoolOwnerRewardOptions { get; set; }

    private readonly IOptions<RewardOptions> _options;

    public ConclaveOwnerRewardHandler(
        ILogger<Worker> logger,
        IConclaveRewardService rewardService,
        IConclaveEpochsService epochsService,
        IConclaveOwnerRewardService conclaveOwnerRewardService,
        IConclaveOwnerSnapshotService conclaveOwnerSnapshotService,
        IOptions<RewardOptions> options)
    {
        _rewardService = rewardService;
        _epochService = epochsService;
        _conclaveOwnerRewardService = conclaveOwnerRewardService;
        _conclaveOwnerSnapshotService = conclaveOwnerSnapshotService;
        _options = options;
        _logger = logger;
    }


    public async Task HandleAsync(ConclaveEpoch newEpoch, ConclaveEpoch? currentEpoch)
    {
        if (newEpoch.ConclaveOwnerSnapshotStatus != SnapshotStatus.Completed) return;
        if (newEpoch.ConclaveOwnerRewardStatus == RewardStatus.Completed) return;

        // TODO: Need to set schedule here
        ExecuteConclaveOwnerRewardSchedulerAsync(currentEpoch);

        var conclaveOwnerSnapshots = _conclaveOwnerSnapshotService.GetAllByEpochNumber(newEpoch.EpochNumber);

        // Update reward status
        newEpoch.ConclaveOwnerRewardStatus = RewardStatus.InProgress;
        await _epochService.UpdateAsync(newEpoch.Id, newEpoch);

        // TODO: calculate reward here
        //Get PoolOwnerReward
        var conclaveOwnerRewards = _rewardService.CalculateConclaveOwnerRewardsAsync(conclaveOwnerSnapshots, 594.0 * (_options.Value.ConclaveOwnerRewardSharePercentage/100.0));

        foreach (var conclaveOwnerReward in conclaveOwnerRewards) await _conclaveOwnerRewardService.CreateAsync(conclaveOwnerReward);

        newEpoch.ConclaveOwnerRewardStatus = RewardStatus.Completed;
        await _epochService.UpdateAsync(newEpoch.Id, newEpoch);
    }

    private async Task PrepareAirdrop()
    {

    }

    private async Task ExecuteConclaveOwnerRewardSchedulerAsync(ConclaveEpoch epoch)
    {
        _logger.LogInformation("Executing ConclaveRewardCyclerAsync");

        var delayInMilliseconds = ConclaveOwnerScheduler!.GetPoolOwnerRewardDelayInMilliseconds(epoch!,
                                                                                           PoolOwnerRewardOptions!.Value.PoolOwnerRewardCompleteAfterMilliseconds);

        _logger.LogInformation($"Conclave Rewards will be available after {DateUtils.GetReadableTimeFromMilliseconds((int)delayInMilliseconds)}");

        await Task.Delay((int)delayInMilliseconds);

        _logger.LogInformation("Exiting SnapshotCycleWrapperAsync");
    }
}