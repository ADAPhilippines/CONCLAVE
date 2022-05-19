using Blockfrost.Api.Models;
using Blockfrost.Api.Services;
using Conclave.Api.Interfaces.Services;
using Conclave.Api.Options;
using Conclave.Common.Models;
using Microsoft.Extensions.Options;

namespace Conclave.Api.Services;


public class ConclavePoolsService : IConclavePoolsService
{
    private readonly IPoolsService _service;
    private readonly IOptions<ConclaveCardanoOptions> _options;

    public ConclavePoolsService(IPoolsService service, IOptions<ConclaveCardanoOptions> options)
    {
        _service = service;
        _options = options;
    }

    public async Task<List<Delegator>> GetAllUniquePoolDelegatorsAsync()
    {
        HashSet<string> uniquePoolDelegators = new();
        List<Delegator> allDelegators = new();
        var poolIds = _options.Value.PoolIds.ToList();

        foreach (var poolId in poolIds)
        {
            var page = 1;
            while (true)
            {
                var poolDelegators = await GetPoolDelegatorsAsync(poolId, 100, page);

                foreach (var delegator in poolDelegators)
                {
                    if (uniquePoolDelegators.Contains(delegator.StakeId)) continue;

                    uniquePoolDelegators.Add(delegator.StakeId);
                    allDelegators.Add(delegator);
                }

                if (poolDelegators.Count < 100) break;
                page++;
            }
        }

        return allDelegators;
    }

    public async Task<List<Delegator>> GetPoolDelegatorsAsync(string poolId, int? count = 100, int? page = 1)
    {
        if (count > 100) count = 100;
        if (count < 1) count = 100;
        if (page < 1) page = 1;

        PoolDelegatorsResponseCollection poolDelegators =
            await _service.GetDelegatorsAsync(poolId, count, page);

        // check for errors before mapping

        List<Delegator> delegators = new();

        foreach (var poolDelegator in poolDelegators)
        {
            delegators.Add(new Delegator(poolDelegator.Address, long.Parse(poolDelegator.LiveStake)));
        }

        return delegators;
    }
}
