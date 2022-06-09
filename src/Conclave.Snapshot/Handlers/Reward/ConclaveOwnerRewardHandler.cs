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
    private readonly IOptions<ConclaveDistributionParameters> _conclaveDistributionParameters;

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
        IOptions<ConclaveDistributionParameters> conclaveDistributionParameters,
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
        _conclaveDistributionParameters = conclaveDistributionParameters;
    }

    public async Task HandleAsync(ConclaveEpoch epoch)
    {
        _logger.LogInformation("Executing ConclaveOwnerCalculationsAsync");
        
        if (epoch.ConclaveOwnerSnapshotStatus != SnapshotStatus.Completed) return;
        if (epoch.ConclaveOwnerRewardStatus == RewardStatus.Completed) return;

        // TODO: Need to set schedule here
        await ExecuteConclaveOwnerRewardSchedulerAsync(epoch);

        var conclaveOwnerSnapshots = _conclaveOwnerSnapshotService.GetAllByEpochNumber(epoch.EpochNumber);

        if (conclaveOwnerSnapshots is null) return;

        epoch.ConclaveOwnerRewardStatus = RewardStatus.InProgress;
        await _epochService.UpdateAsync(epoch.Id, epoch);

        // TODO: calculate reward here
        var stakeAddresses = _operatorSnapshotService.GetAllByEpochNumber(epoch.EpochNumber)?.Select(e => e.StakeAddress).ToList() ?? new List<string>();
        var totalPoolOwnerReward = await CalculateTotalPoolOwnerReward(stakeAddresses, epoch);

        var conclaveOwnerRewards = _rewardService.CalculateConclaveOwnerRewardsAsync(
            conclaveOwnerSnapshots, totalPoolOwnerReward * (_rewardOptions.Value.ConclaveOwnerRewardSharePercentage / 100.0));

        foreach (var conclaveOwnerReward in conclaveOwnerRewards) await _conclaveOwnerRewardService.CreateAsync(conclaveOwnerReward);

        epoch.ConclaveOwnerRewardStatus = RewardStatus.Completed;
        await _epochService.UpdateAsync(epoch.Id, epoch);
    }

    private async Task ExecuteConclaveOwnerRewardSchedulerAsync(ConclaveEpoch epoch)
    {
        _logger.LogInformation("Executing ConclaveRewardCyclerAsync");

        var delayInMilliseconds = _conclaveShchedulerService.GetPoolOwnerRewardDelayInMilliseconds(
                                    epoch,
                                    _poolOwnerRewardOptions!.Value.PoolOwnerRewardCompleteAfterMilliseconds);

        _logger.LogInformation($"Conclave Rewards will be available after {DateUtils.GetReadableTimeFromMilliseconds((int)delayInMilliseconds)}");

        await Task.Delay(3); // TODO: Change this delay

        _logger.LogInformation("Exiting ConclaveRewardCyclerAsync");
    }

    public async Task<ulong> CalculateTotalPoolOwnerReward(
        IEnumerable<string> stakeAddresses, 
        ConclaveEpoch newEpoch)
    {
        ulong totalReward = 0;

        foreach (var stakeAddress in stakeAddresses)
        {
            var result = _conclaveCardanoService.GetStakeAddressReward(stakeAddress, (long)newEpoch.EpochNumber); // dsadsa
            while (
                result?.Result?.RewardAmount == null ||
                result.Result.RewardAmount < 0)
            {
                _logger.LogInformation("No rewards yet. Wait for 5 more mins");
                await Task.Delay(300000); // 5 mins

                result = _conclaveCardanoService.GetStakeAddressReward(stakeAddress, (long)newEpoch.EpochNumber);
            }

            totalReward += (ulong)result.Result.RewardAmount;
        }

        return totalReward;
    }

    public ulong CalculateTotalConclaveReward(ulong epochNumber)
    {
        var delta = _conclaveDistributionParameters.Value.DeltaInitialSaturationValue;
        var satAmount = _conclaveDistributionParameters.Value.SaturationAmount;
        var satRate = _conclaveDistributionParameters.Value.SaturationRate;

        return (ulong)(delta*((decimal)Math.Pow((double)satRate, epochNumber-1)) + satAmount);
    }
}