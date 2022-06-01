using Conclave.Api.Interfaces;
using Conclave.Api.Options;
using Conclave.Common.Enums;
using Microsoft.Extensions.Options;

namespace Conclave.Airdrop.Handlers;

public class OperatorAirdropHandler
{

    private readonly IOperatorRewardService _operatorRewardService;
    private readonly AirdropOptions _options;

    public OperatorAirdropHandler(IOperatorRewardService operatorRewardService,
                                  IOptions<AirdropOptions> options)
    {
        _operatorRewardService = operatorRewardService;
        _options = options.Value;
    }

    public async Task HandleAsync()
    {
        var unpaidOperators = _operatorRewardService.GetAll()?
                                                     .Where(d => d.AirdropStatus == AirdropStatus.New
                                                             || d.AirdropStatus == AirdropStatus.Failed)
                                                     .ToList();

        if (unpaidOperators is null) return;

        // var totalTransactions = unpaidDelegators.Count;
        // var totalEstimatedFee = unpaidDelegators.Count * _options.AdaFeePerTransaction;

        foreach (var unpaidOperator in unpaidOperators)
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