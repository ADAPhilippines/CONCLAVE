using Blockfrost.Api.Models;
using Blockfrost.Api.Services;
using Conclave.Api.Interfaces.Services;
using Conclave.Common.Models;

namespace Conclave.Api.Services;


public class ConclavePoolsService : IConclavePoolsService
{
    private readonly IPoolsService _service;

    public ConclavePoolsService(IPoolsService service)
    {
        _service = service;
    }


    public async Task<List<Delegator>> GetPoolDelegatorsAsync(string poolId)
    {
        PoolDelegatorsResponseCollection poolDelegators = await _service.GetDelegatorsAsync(poolId);

        // check for errors before mapping

        List<Delegator> delegators = new();

        foreach (var poolDelegator in poolDelegators)
        {
            delegators.Add(new Delegator(poolDelegator.Address, long.Parse(poolDelegator.LiveStake)));
        }

        return delegators;
    }
}
