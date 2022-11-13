using Conclave.Common.Enums;
using Conclave.Common.Models;

namespace Conclave.Api.Interfaces;

public interface IConclaveRewardService
{
    IEnumerable<DelegatorReward> CalculateDelegatorRewardsAsync(IEnumerable<DelegatorSnapshot> delegatorSnapshots, double totalReward);
    IEnumerable<ConclaveOwnerReward> CalculateConclaveOwnerRewardsAsync(IEnumerable<ConclaveOwnerSnapshot> conclaveOwnerSnapshots, double totalReward);
    IEnumerable<OperatorReward> CalculateOperatorRewardsAsync(IEnumerable<OperatorSnapshot> operatorSnapshots, double totalReward);
    IEnumerable<NFTReward> CalculateNFTRewardsAsync(IEnumerable<NFTSnapshot> nftSnapshots, double totalReward);
    double CalculateTotalConclaveReward(ulong epochNumber);
    IEnumerable<Reward> GetAllUnpaidRewards();
    IEnumerable<string> GetAllPendingTransactionHashes();
    Task<IEnumerable<Reward>> UpdateRewardStatus(IEnumerable<Reward> rewards, AirdropStatus status, string txHash);
}