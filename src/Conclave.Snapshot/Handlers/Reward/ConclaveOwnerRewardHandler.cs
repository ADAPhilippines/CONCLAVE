using Conclave.Api.Interfaces;
using Conclave.Api.Options;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Microsoft.Extensions.Options;

namespace Conclave.Snapshot.Handlers;

public class ConclaveOwnerRewardHandler
{
    private readonly ILogger<ConclaveOwnerRewardHandler> _logger;
    private readonly IConclaveRewardService _rewardService;
    private readonly IConclaveEpochsService _epochService;
    private readonly IConclaveOwnerRewardService _conclaveOwnerRewardService;
    private readonly IConclaveEpochsService _conclaveEpochsService;
    private readonly IConclaveOwnerSnapshotService _conclaveOwnerSnapshotService;
    private readonly IConclaveSchedulerService _conclaveShchedulerService;
    private readonly IOptions<PoolOwnerRewardOptions> _poolOwnerRewardOptions;
    private readonly IOperatorSnapshotService _operatorSnapshotService;
    private readonly IConclaveCardanoService _conclaveCardanoService;
    private readonly RewardOptions _rewardOptions;
    private readonly ApplicationOptions _applicationOptions;

    public ConclaveOwnerRewardHandler(
        ILogger<ConclaveOwnerRewardHandler> logger,
        IConclaveRewardService rewardService,
        IConclaveEpochsService epochsService,
        IConclaveOwnerRewardService conclaveOwnerRewardService,
        IConclaveOwnerSnapshotService conclaveOwnerSnapshotService,
        IConclaveEpochsService conclaveEpochsService,
        IOperatorSnapshotService operatorSnapshotService,
        IConclaveCardanoService conclaveCardanoService,
        IConclaveSchedulerService conclaveSchedulerService,
        IOptions<PoolOwnerRewardOptions> poolOwnerRewardOptions,
        IOptions<RewardOptions> rewardOptions,
        IOptions<ApplicationOptions> applicationOptions)
    {
        _rewardService = rewardService;
        _epochService = epochsService;
        _conclaveOwnerRewardService = conclaveOwnerRewardService;
        _conclaveOwnerSnapshotService = conclaveOwnerSnapshotService;
        _rewardOptions = rewardOptions.Value;
        _applicationOptions = applicationOptions.Value;
        _poolOwnerRewardOptions = poolOwnerRewardOptions;
        _logger = logger;
        _operatorSnapshotService = operatorSnapshotService;
        _conclaveCardanoService = conclaveCardanoService;
        _conclaveShchedulerService = conclaveSchedulerService;
        _conclaveEpochsService = conclaveEpochsService;
    }

    public async Task HandleAsync()
    {
        _logger.LogInformation("Executing ConclaveOwnerCalculationsAsync");

        var pendingCalculationEpochs = _conclaveEpochsService.GetByConclaveOwnerStatus(SnapshotStatus.Completed, RewardStatus.New);

        foreach (var pendingCalculationEpoch in pendingCalculationEpochs)
        {

            // get total reward for this epoch
            var stakeAddresses = new List<string>();
            var totalPoolOwnerReward = 0UL;

            if (!_applicationOptions.IsDevelopment)
            {
                stakeAddresses = _operatorSnapshotService.GetAllByEpochNumber(pendingCalculationEpoch.EpochNumber)?.Select(e => e.StakeAddress).ToList() ?? new List<string>();
                totalPoolOwnerReward = CalculateTotalPoolOwnerReward(stakeAddresses, (long)pendingCalculationEpoch.EpochNumber);
            }
            else
            {
                totalPoolOwnerReward = 100UL;
            }

            if (totalPoolOwnerReward <= 0) continue;

            var conclaveOwnerSnapshots = _conclaveOwnerSnapshotService.GetAllByEpochNumber(pendingCalculationEpoch.EpochNumber) ?? new List<ConclaveOwnerSnapshot>();

            pendingCalculationEpoch.ConclaveOwnerRewardStatus = RewardStatus.InProgress;
            await _epochService.UpdateAsync(pendingCalculationEpoch.Id, pendingCalculationEpoch);


            var conclaveOwnerRewards = _rewardService.CalculateConclaveOwnerRewardsAsync(
                conclaveOwnerSnapshots, totalPoolOwnerReward * (_rewardOptions.ConclaveOwnerRewardSharePercentage / 100.0));

            foreach (var conclaveOwnerReward in conclaveOwnerRewards) await _conclaveOwnerRewardService.CreateAsync(conclaveOwnerReward);

            pendingCalculationEpoch.ConclaveOwnerRewardStatus = RewardStatus.Completed;
            await _epochService.UpdateAsync(pendingCalculationEpoch.Id, pendingCalculationEpoch);
        }
    }

    public ulong CalculateTotalPoolOwnerReward(
        IEnumerable<string> stakeAddresses,
        long epochNumber)
    {
        ulong totalReward = 0;

        foreach (var stakeAddress in stakeAddresses)
        {
            var result = _conclaveCardanoService.GetStakeAddressReward(stakeAddress, epochNumber).Result;

            if (result is not null) totalReward += (ulong)result.RewardAmount;
        }

        return totalReward;
    }
}