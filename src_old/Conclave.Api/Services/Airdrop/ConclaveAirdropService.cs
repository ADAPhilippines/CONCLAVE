using Conclave.Api.Interfaces;
using Conclave.Common.Enums;
using Conclave.Common.Models;

namespace Conclave.Api.Services;

public class ConclaveAirdropService : IConclaveAirdropService
{
    private readonly IDelegatorRewardService _delegatorRewardService;
    private readonly IOperatorRewardService _operatorRewardService;
    private readonly INFTRewardService _nftRewardService;
    private readonly IConclaveOwnerRewardService _conclaveOwnerRewardService;

    public ConclaveAirdropService(IDelegatorRewardService delegatorRewardService,
                                  IOperatorRewardService operatorRewardService,
                                  INFTRewardService nftRewardService,
                                  IConclaveOwnerRewardService conclaveOwnerRewardService)
    {
        _delegatorRewardService = delegatorRewardService;
        _operatorRewardService = operatorRewardService;
        _nftRewardService = nftRewardService;
        _conclaveOwnerRewardService = conclaveOwnerRewardService;
    }
    public IEnumerable<ConclaveOwnerReward>? GetAllUnpaidConclaveOwnerRewards()
    {
        var unpaidRewards = _conclaveOwnerRewardService.GetAll()?
                                                       .Where(c => c.AirdropStatus == AirdropStatus.New || c.AirdropStatus == AirdropStatus.Failed)
                                                       .ToList();

        return unpaidRewards;
    }

    public IEnumerable<DelegatorReward>? GetAllUnpaidDelegatorRewards()
    {
        var unpaidRewards = _delegatorRewardService.GetAll()?
                                                   .Where(c => c.AirdropStatus == AirdropStatus.New || c.AirdropStatus == AirdropStatus.Failed)
                                                   .ToList();

        return unpaidRewards;
    }

    public IEnumerable<NFTReward>? GetAllUnpaidNFTRewards()
    {
        var unpaidRewards = _nftRewardService.GetAll()?
                                             .Where(c => c.AirdropStatus == AirdropStatus.New || c.AirdropStatus == AirdropStatus.Failed)
                                             .ToList();

        return unpaidRewards;
    }

    public IEnumerable<OperatorReward>? GetAllUnpaidOperatorRewards()
    {
        var unpaidRewards = _operatorRewardService.GetAll()?
                                                  .Where(c => c.AirdropStatus == AirdropStatus.New || c.AirdropStatus == AirdropStatus.Failed)
                                                  .ToList();

        return unpaidRewards;
    }
}