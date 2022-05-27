using System.Runtime.InteropServices;
using Conclave.Api.Interfaces.Services;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Conclave.Data;
using Microsoft.EntityFrameworkCore;

namespace Conclave.Api.Services;


public class ConclaveRewardCalculationService : IConclaveRewardCalculationService
{
    private readonly IConclaveEpochDelegatorRewardService _epochDelegatorRewardService;
    private readonly IConclaveEpochDelegatorService _conclaveEpochDelegatorService;
    private readonly IConclaveEpochsService _conclaveEpochsService;
    private readonly IConclaveEpochRewardService _conclaveEpochRewardService;
    private readonly ApplicationDbContext _context;

    public ConclaveRewardCalculationService(IConclaveEpochDelegatorRewardService epochDelegatorRewardService,
                                            IConclaveEpochDelegatorService conclaveEpochDelegatorService,
                                            IConclaveEpochsService conclaveEpochsService,
                                            IConclaveEpochRewardService conclaveEpochRewardService,
                                            ApplicationDbContext context)
    {
        _epochDelegatorRewardService = epochDelegatorRewardService;
        _conclaveEpochDelegatorService = conclaveEpochDelegatorService;
        _conclaveEpochsService = conclaveEpochsService;
        _conclaveEpochRewardService = conclaveEpochRewardService;
        _context = context;
    }
    public async Task<IEnumerable<ConclaveEpochDelegatorReward>> CalculateAllConclaveTokenShareByEpochAsync(ulong epochNumber)
    {
        var conclaveEpochReward = _context.ConclaveEpochRewards
                                                        .Where(c => c.EpochNumber == epochNumber)
                                                        .FirstOrDefault();

        if (conclaveEpochReward == null) throw new Exception("Reward not yet created");
        if (conclaveEpochReward.TotalConclaveReward < 1) throw new Exception("Reward not yet set!");

        var conclaveDelegatorRewards = _context.ConclaveEpochDelegatorRewards
                                         .Include(c => c.ConclaveEpochReward)
                                         .Where(c => c.ConclaveEpochReward.EpochNumber == epochNumber)
                                         .ToList();

        var totalReward = conclaveEpochReward.TotalConclaveReward * (conclaveEpochReward.DelegatorSharePercentage / 100.0);

        foreach (var conclaveDelegatorReward in conclaveDelegatorRewards)
        {
            conclaveDelegatorReward.TokenShare = CalculateConclaveTokenShare(totalReward, conclaveDelegatorReward).TokenShare;
        }

        await _context.SaveChangesAsync();
        return conclaveDelegatorRewards;
    }

    public async Task<IEnumerable<ConclaveEpochDelegatorReward>> CalculateAllRewardSharePercentageByEpochAsync(ulong epochNumber)
    {

        var conclaveEpoch = _conclaveEpochsService.GetByEpochNumber(epochNumber);
        if (conclaveEpoch is null)
            throw new Exception("Epoch not yet created!");

        if (conclaveEpoch.SnapshotStatus != SnapshotStatus.Completed)
            throw new Exception("Snapshot not yet complete!");

        var conclaveEpochReward = _conclaveEpochRewardService.GetByEpochNumber(epochNumber);
        if (conclaveEpochReward is null)
            throw new Exception("Epoch Reward not yet created!");

        var totalShare = GetTotalPercentageSharesForEpoch(epochNumber);
        if (totalShare > 0)
            throw new Exception("Reward percentage already calculated!");

        var total = _epochDelegatorRewardService.GetTotalDelegatedLoveLaceByEpochNumber(conclaveEpoch.EpochNumber);
        var delegators = _conclaveEpochDelegatorService.GetAllByEpochNumber(conclaveEpoch.EpochNumber);
        List<ConclaveEpochDelegatorReward> conclaveDelegatorRewards = new();

        foreach (var delegator in delegators)
        {
            var conclaveEpochDelegatorReward = CalculateRewardSharePercentage(total, conclaveEpochReward, delegator);
            conclaveDelegatorRewards.Add(conclaveEpochDelegatorReward);
        }

        await _epochDelegatorRewardService.CreateAsync(conclaveDelegatorRewards);

        return conclaveDelegatorRewards;
    }

    public ConclaveEpochDelegatorReward CalculateConclaveTokenShare(double totalReward, ConclaveEpochDelegatorReward conclaveDelegatorReward)
    {
        conclaveDelegatorReward.TokenShare = totalReward * (conclaveDelegatorReward.PercentageShare / 100.0);
        return conclaveDelegatorReward;
    }

    public ConclaveEpochDelegatorReward CalculateRewardSharePercentage(ulong totalDelegated, ConclaveEpochReward conclaveEpochReward, ConclaveEpochDelegator delegator)
    {
        var sharePercentage = (float)CalculatorUtils.GetPercentage(totalDelegated, delegator.ConclaveSnapshot.DelegatedAmount);
        var conclaveEpochDelegatorReward = new ConclaveEpochDelegatorReward
        {
            ConclaveEpochDelegator = delegator,
            ConclaveEpochReward = conclaveEpochReward,
            PercentageShare = sharePercentage
        };

        return conclaveEpochDelegatorReward;
    }

    public double GetTotalPercentageSharesForEpoch(ulong epochNumber)
    {
        var conclaveEpochDelegatorRewards = _epochDelegatorRewardService.GetByEpochNumber(epochNumber);
        var total = 0.0;

        foreach (var conclaveEpochDelegatorReward in conclaveEpochDelegatorRewards)
        {
            total += conclaveEpochDelegatorReward.PercentageShare;
        }

        return total;
    }
}