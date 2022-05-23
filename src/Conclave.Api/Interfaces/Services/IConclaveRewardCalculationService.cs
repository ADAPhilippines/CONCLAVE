namespace Conclave.Api.Interfaces.Services;

using Conclave.Common.Models;


public interface IConclaveRewardCalculationService
{
    ConclaveEpochDelegatorReward? CalculateRewardSharePercentage(ulong totalDelegated, ConclaveEpochDelegator delegator);
    Task<ConclaveEpochDelegatorReward?> CalculateConclaveTokenShare(int totalReward, ConclaveEpochDelegatorReward conclaveDelegatorReward);
    Task<IEnumerable<ConclaveEpochDelegatorReward>?> CalculateAllRewardSharePercentageByEpochAsync(ConclaveEpoch conclaveEpoch);
    Task<IEnumerable<ConclaveEpochDelegatorReward>?> CalculateAllConclaveTokenShareByEpoch(int totalReward, IEnumerable<ConclaveEpochDelegatorReward> conclaveDelegatorRewards);
}