using Conclave.Api.Interfaces;
using Conclave.Api.Options;
using Conclave.Common.Enums;
using Microsoft.Extensions.Options;

namespace Conclave.Airdrop.Handlers;

public class DelegatorAirdropHandler
{

    private readonly IDelegatorRewardService _delegatorRewardService;
    private readonly AirdropOptions _options;

    public DelegatorAirdropHandler(IDelegatorRewardService delegatorRewardService,
                                   IOptions<AirdropOptions> options)
    {
        _delegatorRewardService = delegatorRewardService;
        _options = options.Value;
    }

    public async Task HandleAsync()
    {
        var unpaidDelegators = _delegatorRewardService.GetAll()?
                                                      .Where(d => d.AirdropStatus == AirdropStatus.New
                                                             || d.AirdropStatus == AirdropStatus.Failed)
                                                      .ToList();

        if (unpaidDelegators is null) return;

        // var totalTransactions = unpaidDelegators.Count;
        // var totalEstimatedFee = unpaidDelegators.Count * _options.AdaFeePerTransaction;

        foreach (var unpaidDelegator in unpaidDelegators)
        {
            //TODO: Check if wallet has enough to cover the ADA fee
            //TODO: Check if the transaction will be successful

            // If successful
            ////// TODO: Airdrop the tokens
            // TODO: Change status to completed
            // Else
            ////// TODO: Change status to failed
        }
    }
}