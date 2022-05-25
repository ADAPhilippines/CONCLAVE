using Conclave.Api.Interfaces.Services;
using Conclave.Common.Models;
using Conclave.Data;

namespace Conclave.Api.Services;

public class ConclaveEpochDelegatorRewardService : IConclaveEpochDelegatorRewardService
{
    private readonly ApplicationDbContext _context;

    public ConclaveEpochDelegatorRewardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public Task<ConclaveEpochDelegatorReward> Create(ConclaveEpochDelegatorReward conclaveEpochDelegatorReward)
    {
        throw new NotImplementedException();
    }

    public async Task<IEnumerable<ConclaveEpochDelegatorReward>> CreateAsync(IEnumerable<ConclaveEpochDelegatorReward> conclaveEpochDelegatorRewards)
    {
        _context.AddRange(conclaveEpochDelegatorRewards);
        await _context.SaveChangesAsync();

        return conclaveEpochDelegatorRewards;
    }

    public Task<ConclaveEpochDelegatorReward> Delete(Guid Id, ConclaveEpochDelegatorReward conclaveEpochDelegatorReward)
    {
        throw new NotImplementedException();
    }

    public IEnumerable<ConclaveEpochDelegatorReward?> GetByEpoch(ConclaveEpoch conclaveEpoch)
    {
        throw new NotImplementedException();
    }

    public IEnumerable<ConclaveEpochDelegatorReward?> GetByEpochNumber(ulong epochNumber)
    {
        throw new NotImplementedException();
    }

    public ConclaveEpochDelegatorReward? GetById(Guid id)
    {
        throw new NotImplementedException();
    }

    public IEnumerable<ConclaveEpochDelegatorReward?> GetByStakeAddress(string stakeAddress)
    {
        throw new NotImplementedException();
    }

    public ulong GetTotalDelegatedLoveLaceByEpochNumber(ulong epochNumber)
    {
        var delegatedAmounts = _context.ConclaveSnapshots
                            .Where(s => s.ConclaveEpoch.EpochNumber == epochNumber)
                            .Select(s => s.DelegatedAmount)
                            .ToList();

        var total = delegatedAmounts.Aggregate(0UL, (a, c) => a + c);
        return total;
    }

    public Task<ConclaveEpochDelegatorReward> Update(Guid Id, ConclaveEpochDelegatorReward conclaveEpochDelegatorReward)
    {
        throw new NotImplementedException();
    }
}