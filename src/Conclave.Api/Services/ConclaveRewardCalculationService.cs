using Conclave.Api.Interfaces.Services;
using Conclave.Common.Models;
using Conclave.Common.Utils;

namespace Conclave.Api.Services;


public class ConclaveRewardCalculationService : IConclaveRewardCalculationService
{
    private readonly IConclaveEpochDelegatorRewardService _epochDelegatorRewardService;
    private readonly IConclaveEpochDelegatorService _conclaveEpochDelegatorService;

    public ConclaveRewardCalculationService(IConclaveEpochDelegatorRewardService epochDelegatorRewardService,
                                            IConclaveEpochDelegatorService conclaveEpochDelegatorService)
    {
        _epochDelegatorRewardService = epochDelegatorRewardService;
        _conclaveEpochDelegatorService = conclaveEpochDelegatorService;
    }
    public Task<IEnumerable<ConclaveEpochDelegatorReward>?> CalculateAllConclaveTokenShareByEpoch(int totalReward, IEnumerable<ConclaveEpochDelegatorReward> conclaveDelegatorRewards)
    {
        throw new NotImplementedException();
    }

    public async Task<IEnumerable<ConclaveEpochDelegatorReward>?> CalculateAllRewardSharePercentageByEpochAsync(ConclaveEpoch conclaveEpoch)
    {
        var total = _epochDelegatorRewardService.GetTotalDelegatedLoveLaceByEpochNumber(conclaveEpoch.EpochNumber);
        var delegators = _conclaveEpochDelegatorService.GetAllByEpochNumber(conclaveEpoch.EpochNumber);
        List<ConclaveEpochDelegatorReward> conclaveDelegatorRewards = new();
        foreach (var delegator in delegators)
        {
            var conclaveEpochDelegatorReward = CalculateRewardSharePercentage(total, delegator);
            conclaveDelegatorRewards.Add(conclaveEpochDelegatorReward);
        }

        await _epochDelegatorRewardService.CreateAsync(conclaveDelegatorRewards);

        return conclaveDelegatorRewards;
    }

    public Task<ConclaveEpochDelegatorReward?> CalculateConclaveTokenShare(int totalReward, ConclaveEpochDelegatorReward conclaveDelegatorReward)
    {
        throw new NotImplementedException();
    }

    public ConclaveEpochDelegatorReward? CalculateRewardSharePercentage(ulong totalDelegated, ConclaveEpochDelegator delegator)
    {
        var sharePercentage = (float)CalculatorUtils.GetPercentage(totalDelegated, delegator.ConclaveSnapshot.DelegatedAmount);
        var conclaveEpochReward = new ConclaveEpochDelegatorReward
        {
            ConclaveEpochDelegator = delegator,
            ConclaveEpochReward = new ConclaveEpochReward(), // update this to point to a database entry 
            PercentageShare = sharePercentage
        };

        return conclaveEpochReward;
    }
}