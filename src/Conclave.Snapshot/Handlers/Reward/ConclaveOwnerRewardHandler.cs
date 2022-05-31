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
    private readonly IConclaveSchedulerService _conclaveShchedulerService;
    private readonly IOptions<PoolOwnerRewardOptions> _poolOwnerRewardOptions;
    private readonly IOperatorSnapshotService _operatorSnapshotService;
    private readonly IConclaveCardanoService _conclaveCardanoService;
    private readonly IOptions<RewardOptions> _rewardOptions;

    public ConclaveOwnerRewardHandler(
        ILogger<Worker> logger,
        IConclaveRewardService rewardService,
        IConclaveEpochsService epochsService,
        IConclaveOwnerRewardService conclaveOwnerRewardService,
        IConclaveOwnerSnapshotService conclaveOwnerSnapshotService,
        IOperatorSnapshotService operatorSnapshotService,
        IConclaveCardanoService conclaveCardanoService,
        IConclaveSchedulerService conclaveSchedulerService,
        IOptions<PoolOwnerRewardOptions> poolOwnerRewardOptions,
        IOptions<RewardOptions> rewardOptions)
    {
        _rewardService = rewardService;
        _epochService = epochsService;
        _conclaveOwnerRewardService = conclaveOwnerRewardService;
        _conclaveOwnerSnapshotService = conclaveOwnerSnapshotService;
        _rewardOptions = rewardOptions;
        _poolOwnerRewardOptions = poolOwnerRewardOptions;
        _logger = logger;
        _operatorSnapshotService = operatorSnapshotService;
        _conclaveCardanoService = conclaveCardanoService;
        _conclaveShchedulerService = conclaveSchedulerService;
    }


    public async Task HandleAsync(ConclaveEpoch newEpoch, ConclaveEpoch currentEpoch)
    {
        if (newEpoch.ConclaveOwnerSnapshotStatus != SnapshotStatus.Completed) return;
        if (newEpoch.ConclaveOwnerRewardStatus == RewardStatus.Completed) return;

        // TODO: Need to set schedule here
        await ExecuteConclaveOwnerRewardSchedulerAsync(currentEpoch);
        //uncomment in actual
        var conclaveOwnerSnapshots = _conclaveOwnerSnapshotService.GetAllByEpochNumber(newEpoch.EpochNumber);

        // Update reward status
        newEpoch.ConclaveOwnerRewardStatus = RewardStatus.InProgress;
        await _epochService.UpdateAsync(newEpoch.Id, newEpoch);

        // TODO: calculate reward here
        var stakeAddresses = GetStakeAddressByEpoch(newEpoch.EpochNumber);
        var totalReward = CalculateTotalPoolOwnerReward(stakeAddresses, newEpoch);

        if (conclaveOwnerSnapshots == null) return;
        var conclaveOwnerRewards = _rewardService.CalculateConclaveOwnerRewardsAsync(
            conclaveOwnerSnapshots, totalReward * (_rewardOptions.Value.ConclaveOwnerRewardSharePercentage/100.0));

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

        var delayInMilliseconds = _conclaveShchedulerService.GetPoolOwnerRewardDelayInMilliseconds(epoch,
                                    _poolOwnerRewardOptions.Value.PoolOwnerRewardCompleteAfterMilliseconds);

        _logger.LogInformation($"Conclave Rewards will be available after {DateUtils.GetReadableTimeFromMilliseconds((int)delayInMilliseconds)}");

        await Task.Delay(3);

        _logger.LogInformation("Exiting SnapshotCycleWrapperAsync");
    }

    private IEnumerable<string>? GetStakeAddressByEpoch (ulong epochNumber)
    {
        var operatorRewards = _operatorSnapshotService.GetAll()?.ToList();

        var result = operatorRewards?
                    .Where(t => t.ConclaveEpoch.EpochNumber == epochNumber)
                    .Select(t => t.StakeAddress)
                    .ToList();
        
        return result;
    }

    
    public ulong CalculateTotalPoolOwnerReward(IEnumerable<string> stakeAddresses, ConclaveEpoch newEpoch)
    {
        ulong totalReward = 0;
        while (totalReward == 0)
        {
            foreach (var stakeAddress in stakeAddresses)
            {
                var result = _conclaveCardanoService.GetStakeAddressReward(stakeAddress, (long)newEpoch.EpochNumber);
                totalReward += (ulong)result.Result.RewardAmount;
            }

            if (totalReward == 0) {
                _logger.LogInformation("No rewards yet. Wait for 5 mins");
                Task.Delay(300000);
            }
        }
        return totalReward;
    }
}