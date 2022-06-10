using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Conclave.Common.Utils;

namespace Conclave.Api.Services;

public class ConclaveRewardService : IConclaveRewardService
{
    public IEnumerable<ConclaveOwnerReward> CalculateConclaveOwnerRewardsAsync(IEnumerable<ConclaveOwnerSnapshot> conclaveOwnerSnapshots, double totalReward)
    {
        var totalQuantity = conclaveOwnerSnapshots.Aggregate(0.0, (acc, cur) => acc + cur.Quantity);
        var conclaveOwnerRewards = new List<ConclaveOwnerReward>();

        foreach (var conclaveOwnerSnapshot in conclaveOwnerSnapshots)
        {

            var rewardPercentage = CalculatorUtils.GetPercentage(totalQuantity, conclaveOwnerSnapshot.Quantity);
            var rewardAmount = totalReward * (rewardPercentage / 100);

            var reward = new ConclaveOwnerReward
            {
                ConclaveOwnerSnapshot = conclaveOwnerSnapshot,
                RewardPercentage = rewardPercentage,
                RewardAmount = rewardAmount
            };

            conclaveOwnerRewards.Add(reward);
        }

        return conclaveOwnerRewards;
    }

    public IEnumerable<DelegatorReward> CalculateDelegatorRewardsAsync(IEnumerable<DelegatorSnapshot> delegatorSnapshots, double totalReward)
    {
        var totalQuantity = delegatorSnapshots.Aggregate(0.0, (acc, cur) => acc + cur.Quantity);
        var delegatorRewards = new List<DelegatorReward>();

        foreach (var delegatorSnapshot in delegatorSnapshots)
        {

            var rewardPercentage = CalculatorUtils.GetPercentage(totalQuantity, delegatorSnapshot.Quantity);
            var rewardAmount = totalReward * (rewardPercentage / 100);

            var reward = new DelegatorReward
            {
                DelegatorSnapshot = delegatorSnapshot,
                RewardPercentage = rewardPercentage,
                RewardAmount = rewardAmount
            };

            delegatorRewards.Add(reward);
        }

        return delegatorRewards;
    }

    public IEnumerable<NFTReward> CalculateNFTRewardsAsync(IEnumerable<NFTSnapshot> nftSnapshots, double totalReward)
    {
        var nftRewards = new List<NFTReward>();
        var uniqueNFTGroupCount = nftSnapshots.GroupBy(x => x.NFTProject.NFTGroup).Count();

        foreach (var nftSnapshot in nftSnapshots)
        {
            var totalWeight = nftSnapshots.Where(x => x.NFTProject.NFTGroup == nftSnapshot.NFTProject.NFTGroup).Sum(x => x.Weight);
            var rewardPercentage = CalculatorUtils.GetPercentage(totalWeight, nftSnapshot.Weight);

            // Get NFT Group share of total reward
            var rewardAmount = totalReward * (rewardPercentage / 100) / uniqueNFTGroupCount;

            var reward = new NFTReward
            {
                NFTSnapshot = nftSnapshot,
                RewardPercentage = rewardPercentage,
                RewardAmount = rewardAmount
            };

            nftRewards.Add(reward);
        }

        return nftRewards;
    }

    public IEnumerable<OperatorReward> CalculateOperatorRewardsAsync(IEnumerable<OperatorSnapshot> operatorSnapshots, double totalReward)
    {
        var totalQuantity = operatorSnapshots.Aggregate(0.0, (acc, cur) => acc + cur.Pledge);
        var operatorRewards = new List<OperatorReward>();

        foreach (var operatorSnapshot in operatorSnapshots)
        {

            var rewardPercentage = CalculatorUtils.GetPercentage(totalQuantity, operatorSnapshot.Pledge);
            var rewardAmount = totalReward * (rewardPercentage / 100);

            var reward = new OperatorReward
            {
                OperatorSnapshot = operatorSnapshot,
                RewardPercentage = rewardPercentage,
                RewardAmount = rewardAmount
            };

            operatorRewards.Add(reward);
        }

        return operatorRewards;
    }
}