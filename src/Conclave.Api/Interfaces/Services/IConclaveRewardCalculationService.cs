namespace Conclave.Api.Interfaces.Services;

using Conclave.Common.Models;


public interface IConclaveRewardCalculationService
{
    double GetTotalPercentageSharesForEpoch(ulong epochNumber);
    ConclaveEpochDelegatorReward CalculateRewardSharePercentage(ulong totalDelegated, ConclaveEpochReward conclaveEpochReward, ConclaveEpochDelegator delegator);
    ConclaveEpochDelegatorReward CalculateConclaveTokenShare(double totalReward, ConclaveEpochDelegatorReward conclaveDelegatorReward);
    Task<IEnumerable<ConclaveEpochDelegatorReward>> CalculateAllRewardSharePercentageByEpochAsync(ulong epochNumber);
    Task<IEnumerable<ConclaveEpochDelegatorReward>> CalculateAllConclaveTokenShareByEpochAsync(ulong epochNumber);

}