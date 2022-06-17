using Conclave.Common.Models;

namespace Conclave.Api.Interfaces;

public interface IConclaveRewardService
{
    IEnumerable<DelegatorReward> CalculateDelegatorRewardsAsync(IEnumerable<DelegatorSnapshot> delegatorSnapshots, double totalReward);
    IEnumerable<ConclaveOwnerReward> CalculateConclaveOwnerRewardsAsync(IEnumerable<ConclaveOwnerSnapshot> conclaveOwnerSnapshots, double totalReward);
    IEnumerable<OperatorReward> CalculateOperatorRewardsAsync(IEnumerable<OperatorSnapshot> operatorSnapshots, double totalReward);
    IEnumerable<NFTReward> CalculateNFTRewardsAsync(IEnumerable<NFTSnapshot> nftSnapshots, double totalReward);
    double CalculateTotalConclaveReward(ulong epochNumber);
}