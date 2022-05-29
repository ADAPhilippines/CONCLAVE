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
                DelegatorSnapshot = conclaveOwnerSnapshot,
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
        var totalQuantity = nftSnapshots.Aggregate(0.0, (acc, cur) => acc + cur.Quantity);
        var nftRewards = new List<NFTReward>();

        foreach (var nftSnapshot in nftSnapshots)
        {

            var rewardPercentage = CalculatorUtils.GetPercentage(totalQuantity, nftSnapshot.Quantity);
            var rewardAmount = totalReward * (rewardPercentage / 100);

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