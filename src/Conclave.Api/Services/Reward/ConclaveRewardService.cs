using System.ComponentModel.DataAnnotations;
using Conclave.Api.Interfaces;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Microsoft.Extensions.Options;

namespace Conclave.Api.Services;

public class ConclaveRewardService : IConclaveRewardService
{

    private readonly ConclaveDistributionParameters _options;
    private readonly IDelegatorRewardService _delegatorRewardService;
    private readonly INFTRewardService _nftRewardService;
    private readonly IOperatorRewardService _opeartorRewardService;
    private readonly IConclaveOwnerRewardService _conclaveOwnerRewardService;

    public ConclaveRewardService(IOptions<ConclaveDistributionParameters> options,
                                 IDelegatorRewardService delegatorRewardService,
                                 INFTRewardService nftRewardService,
                                 IOperatorRewardService operatorRewardService,
                                 IConclaveOwnerRewardService conclaveOwnerRewardService)
    {
        _options = options.Value;
        _delegatorRewardService = delegatorRewardService;
        _nftRewardService = nftRewardService;
        _opeartorRewardService = operatorRewardService;
        _conclaveOwnerRewardService = conclaveOwnerRewardService;
    }


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

    public double CalculateTotalConclaveReward(ulong epochNumber)
    {
        var delta = _options.DeltaInitialSaturationValue;
        var satAmount = _options.SaturationAmount;
        var satRate = (double)_options.SaturationRate;

        return delta * Math.Pow(satRate, epochNumber - 1) + satAmount;
    }

    public IEnumerable<string> GetAllPendingTransactionHashes()
    {
        var delegatorRewardsHashes = _delegatorRewardService.GetAllByAirdropStatus(AirdropStatus.InProgress)?.Select(d => d.TransactionHash).ToList().Distinct() ?? new List<string>();
        var nftRewardsHashes = _nftRewardService.GetAllByAirdropStatus(AirdropStatus.InProgress)?.Select(d => d.TransactionHash).ToList().Distinct() ?? new List<string>();
        var operatorRewardsHashes = _opeartorRewardService.GetAllByAirdropStatus(AirdropStatus.InProgress)?.Select(d => d.TransactionHash).ToList().Distinct() ?? new List<string>();
        var conclaveOwnerRewardsHashes = _conclaveOwnerRewardService.GetAllByAirdropStatus(AirdropStatus.InProgress)?.Select(d => d.TransactionHash).ToList().Distinct() ?? new List<string>();

        var pendingTransactionHashes = delegatorRewardsHashes.Concat(nftRewardsHashes)
                                                             .Concat(operatorRewardsHashes)
                                                             .Concat(conclaveOwnerRewardsHashes)
                                                             .ToList()
                                                             .Distinct();

        return pendingTransactionHashes;
    }

    public IEnumerable<Reward> GetAllUnpaidRewards()
    {
        var unpaidRewards = new List<Reward>();
        var delegatorRewards = _delegatorRewardService.GetAllByAirdropStatus(AirdropStatus.New) ?? new List<DelegatorReward>();
        var nftRewards = _nftRewardService.GetAllByAirdropStatus(AirdropStatus.New) ?? new List<NFTReward>();
        var operatorRewards = _opeartorRewardService.GetAllByAirdropStatus(AirdropStatus.New) ?? new List<OperatorReward>();
        var conclaveOwnerRewards = _conclaveOwnerRewardService.GetAllByAirdropStatus(AirdropStatus.New) ?? new List<ConclaveOwnerReward>();

        foreach (var delegatorReward in delegatorRewards)
        {
            unpaidRewards.Add(new Reward(delegatorReward.Id,
                                         RewardType.DelegatorReward,
                                         delegatorReward.RewardAmount,
                                         delegatorReward.DelegatorSnapshot.WalletAddress,
                                         delegatorReward.DelegatorSnapshot.StakeAddress));
        }

        foreach (var nftReward in nftRewards)
        {
            unpaidRewards.Add(new Reward(nftReward.Id,
                                         RewardType.NFTReward,
                                         nftReward.RewardAmount,
                                         nftReward.NFTSnapshot.DelegatorSnapshot.WalletAddress,
                                         nftReward.NFTSnapshot.DelegatorSnapshot.StakeAddress));
        }

        foreach (var operatorReward in operatorRewards)
        {
            unpaidRewards.Add(new Reward(operatorReward.Id,
                                         RewardType.OperatorReward,
                                         operatorReward.RewardAmount,
                                         operatorReward.OperatorSnapshot.WalletAddress,
                                         operatorReward.OperatorSnapshot.StakeAddress));
        }

        foreach (var conclaveOwnerReward in conclaveOwnerRewards)
        {
            unpaidRewards.Add(new Reward(conclaveOwnerReward.Id,
                                         RewardType.ConclaveOwnerReward,
                                         conclaveOwnerReward.RewardAmount,
                                         conclaveOwnerReward.ConclaveOwnerSnapshot.DelegatorSnapshot.WalletAddress,
                                         conclaveOwnerReward.ConclaveOwnerSnapshot.DelegatorSnapshot.StakeAddress));
        }

        return unpaidRewards;
    }

    public async Task<IEnumerable<Reward>> UpdateRewardStatus(IEnumerable<Reward> rewards, AirdropStatus status)
    {
        var updatedRewardStatus = new List<Reward>();

        foreach (var reward in rewards)
        {
            switch (reward.RewardType)
            {
                case RewardType.DelegatorReward:
                    var delegatorReward = _delegatorRewardService.GetById(reward.Id);

                    if (delegatorReward is null) break;

                    delegatorReward.AirdropStatus = status;
                    await _delegatorRewardService.UpdateAsync(delegatorReward.Id, delegatorReward);

                    break;
                case RewardType.NFTReward:
                    var nftReward = _nftRewardService.GetById(reward.Id);

                    if (nftReward is null) break;

                    nftReward.AirdropStatus = status;
                    await _nftRewardService.UpdateAsync(nftReward.Id, nftReward);

                    break;
                case RewardType.OperatorReward:
                    var operatorReward = _opeartorRewardService.GetById(reward.Id);

                    if (operatorReward is null) break;

                    operatorReward.AirdropStatus = status;
                    await _opeartorRewardService.UpdateAsync(operatorReward.Id, operatorReward);

                    break;
                case RewardType.ConclaveOwnerReward:
                    var conclaveOwnerReward = _conclaveOwnerRewardService.GetById(reward.Id);

                    if (conclaveOwnerReward is null) break;

                    conclaveOwnerReward.AirdropStatus = status;
                    await _conclaveOwnerRewardService.UpdateAsync(conclaveOwnerReward.Id, conclaveOwnerReward);

                    break;
                default:
                    throw new Exception("Invalid reward type");
            }
        }



        return updatedRewardStatus;
    }
}