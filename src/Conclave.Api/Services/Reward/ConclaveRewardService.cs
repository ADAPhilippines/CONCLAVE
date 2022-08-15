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
    private readonly ILogger<ConclaveRewardService> _logger;

    public ConclaveRewardService(IOptions<ConclaveDistributionParameters> options,
                                 IDelegatorRewardService delegatorRewardService,
                                 INFTRewardService nftRewardService,
                                 IOperatorRewardService operatorRewardService,
                                 IConclaveOwnerRewardService conclaveOwnerRewardService,
                                 ILogger<ConclaveRewardService> logger)
    {
        _options = options.Value;
        _delegatorRewardService = delegatorRewardService;
        _nftRewardService = nftRewardService;
        _opeartorRewardService = operatorRewardService;
        _conclaveOwnerRewardService = conclaveOwnerRewardService;
        _logger = logger;
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
        var newDelegatorRewards = _delegatorRewardService.GetAllByAirdropStatus(AirdropStatus.New) ?? new List<DelegatorReward>();
        var inProgressDelegatorRewards = _delegatorRewardService.GetAllByAirdropStatus(AirdropStatus.InProgress) ?? new List<DelegatorReward>();
        var newNftRewards = _nftRewardService.GetAllByAirdropStatus(AirdropStatus.New) ?? new List<NFTReward>();
        var inProgressNftRewards = _nftRewardService.GetAllByAirdropStatus(AirdropStatus.InProgress) ?? new List<NFTReward>();
        var newOperatorRewards = _opeartorRewardService.GetAllByAirdropStatus(AirdropStatus.New) ?? new List<OperatorReward>();
        var inProgressOperatorRewards = _opeartorRewardService.GetAllByAirdropStatus(AirdropStatus.InProgress) ?? new List<OperatorReward>();
        var newConclaveOwnerRewards = _conclaveOwnerRewardService.GetAllByAirdropStatus(AirdropStatus.New) ?? new List<ConclaveOwnerReward>();
        var inProgressConclaveOwnerRewards = _conclaveOwnerRewardService.GetAllByAirdropStatus(AirdropStatus.InProgress) ?? new List<ConclaveOwnerReward>();

        foreach (var newDelegatorReward in newDelegatorRewards)
        {
            unpaidRewards.Add(new Reward(newDelegatorReward.Id,
                                         RewardType.DelegatorReward,
                                         newDelegatorReward.RewardAmount,
                                         newDelegatorReward.DelegatorSnapshot.WalletAddress,
                                         newDelegatorReward.DelegatorSnapshot.StakeAddress,
                                         newDelegatorReward.TransactionHash));
        }

        foreach (var inProgressDelegatorReward in inProgressDelegatorRewards)
        {
            unpaidRewards.Add(new Reward(inProgressDelegatorReward.Id,
                                         RewardType.DelegatorReward,
                                         inProgressDelegatorReward.RewardAmount,
                                         inProgressDelegatorReward.DelegatorSnapshot.WalletAddress,
                                         inProgressDelegatorReward.DelegatorSnapshot.StakeAddress,
                                         inProgressDelegatorReward.TransactionHash));
        }

        foreach (var newNftReward in newNftRewards)
        {
            unpaidRewards.Add(new Reward(newNftReward.Id,
                                         RewardType.NFTReward,
                                         newNftReward.RewardAmount,
                                         newNftReward.NFTSnapshot.DelegatorSnapshot.WalletAddress,
                                         newNftReward.NFTSnapshot.DelegatorSnapshot.StakeAddress,
                                         newNftReward.TransactionHash));
        }

        foreach (var inProgressNftReward in inProgressNftRewards)
        {
            unpaidRewards.Add(new Reward(inProgressNftReward.Id,
                                         RewardType.NFTReward,
                                         inProgressNftReward.RewardAmount,
                                         inProgressNftReward.NFTSnapshot.DelegatorSnapshot.WalletAddress,
                                         inProgressNftReward.NFTSnapshot.DelegatorSnapshot.StakeAddress,
                                         inProgressNftReward.TransactionHash));
        }

        foreach (var newOperatorReward in newOperatorRewards)
        {
            unpaidRewards.Add(new Reward(newOperatorReward.Id,
                                         RewardType.OperatorReward,
                                         newOperatorReward.RewardAmount,
                                         newOperatorReward.OperatorSnapshot.WalletAddress,
                                         newOperatorReward.OperatorSnapshot.StakeAddress,
                                         newOperatorReward.TransactionHash));
        }

        foreach (var inProgressOperatorReward in inProgressOperatorRewards)
        {
            unpaidRewards.Add(new Reward(inProgressOperatorReward.Id,
                                         RewardType.OperatorReward,
                                         inProgressOperatorReward.RewardAmount,
                                         inProgressOperatorReward.OperatorSnapshot.WalletAddress,
                                         inProgressOperatorReward.OperatorSnapshot.StakeAddress,
                                         inProgressOperatorReward.TransactionHash));
        }

        foreach (var newConclaveOwnerReward in newConclaveOwnerRewards)
        {
            unpaidRewards.Add(new Reward(newConclaveOwnerReward.Id,
                                         RewardType.ConclaveOwnerReward,
                                         newConclaveOwnerReward.RewardAmount*1_000_000,
                                         newConclaveOwnerReward.ConclaveOwnerSnapshot.DelegatorSnapshot.WalletAddress,
                                         newConclaveOwnerReward.ConclaveOwnerSnapshot.DelegatorSnapshot.StakeAddress,
                                         newConclaveOwnerReward.TransactionHash));
        }


        foreach (var inProgressConclaveOwnerReward in inProgressConclaveOwnerRewards)
        {
            unpaidRewards.Add(new Reward(inProgressConclaveOwnerReward.Id,
                                         RewardType.ConclaveOwnerReward,
                                         inProgressConclaveOwnerReward.RewardAmount*1_000_000,
                                         inProgressConclaveOwnerReward.ConclaveOwnerSnapshot.DelegatorSnapshot.WalletAddress,
                                         inProgressConclaveOwnerReward.ConclaveOwnerSnapshot.DelegatorSnapshot.StakeAddress,
                                         inProgressConclaveOwnerReward.TransactionHash));
        }

        return unpaidRewards;
    }

    public async Task<IEnumerable<Reward>> UpdateRewardStatus(IEnumerable<Reward> rewards, AirdropStatus status, string txHash)
    {

        var updatedRewardStatus = new List<Reward>();

        _logger.LogCritical($"Rewards Count: {rewards.Count()}");

        foreach (var reward in rewards)
        {
            _logger.LogCritical($"Updating reward status to {status} for {reward.Id} of {reward.RewardType}");
            switch (reward.RewardType)
            {
                case RewardType.DelegatorReward:
                    var delegatorReward = _delegatorRewardService.GetById(reward.Id);

                    if (delegatorReward is null) break;

                    delegatorReward.AirdropStatus = status;
                    delegatorReward.TransactionHash = txHash;
                    await _delegatorRewardService.UpdateAsync(delegatorReward.Id, delegatorReward);

                    break;
                case RewardType.NFTReward:
                    var nftReward = _nftRewardService.GetById(reward.Id);

                    if (nftReward is null) break;

                    nftReward.AirdropStatus = status;
                    nftReward.TransactionHash = txHash;
                    await _nftRewardService.UpdateAsync(nftReward.Id, nftReward);

                    break;
                case RewardType.OperatorReward:
                    _logger.LogError($"**************Operator");
                    var operatorReward = _opeartorRewardService.GetById(reward.Id);

                    if (operatorReward is null) break;

                    operatorReward.AirdropStatus = status;
                    operatorReward.TransactionHash = txHash;
                    await _opeartorRewardService.UpdateAsync(operatorReward.Id, operatorReward);

                    break;
                case RewardType.ConclaveOwnerReward:
                    _logger.LogError($"**************ConclaveOwnerReward");
                    var conclaveOwnerReward = _conclaveOwnerRewardService.GetById(reward.Id);

                    if (conclaveOwnerReward is null) break;

                    conclaveOwnerReward.AirdropStatus = status;
                    conclaveOwnerReward.TransactionHash = txHash;
                    await _conclaveOwnerRewardService.UpdateAsync(conclaveOwnerReward.Id, conclaveOwnerReward);

                    break;
                default:
                    throw new Exception("Invalid reward type");
            }
        }



        return updatedRewardStatus;
    }
}