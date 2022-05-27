using Conclave.Api.Interfaces.Services;
using Conclave.Common.Models;
using Conclave.Data;
using Microsoft.EntityFrameworkCore;

namespace Conclave.Api.Services;

public class ConclaveEpochDelegatorRewardService : IConclaveEpochDelegatorRewardService
{
    private readonly ApplicationDbContext _dbContext;

    public ConclaveEpochDelegatorRewardService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Task<ConclaveEpochDelegatorReward> Create(ConclaveEpochDelegatorReward conclaveEpochDelegatorReward)
    {
        throw new NotImplementedException();
    }

    public async Task<IEnumerable<ConclaveEpochDelegatorReward>> CreateAsync(IEnumerable<ConclaveEpochDelegatorReward> conclaveEpochDelegatorRewards)
    {
        _dbContext.AddRange(conclaveEpochDelegatorRewards);
        await _dbContext.SaveChangesAsync();

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

    public async Task<IEnumerable<ConclaveEpochDelegatorReward?>> GetByEpochNumberAsync(ulong epochNumber)
    {
        var delegatorRewards = await _dbContext.ConclaveEpochDelegatorRewards
                                .Include(c => c.ConclaveEpochReward)
                                .Where(c => c.ConclaveEpochReward.EpochNumber == epochNumber)
                                .ToListAsync();

        return delegatorRewards;
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
        var delegatedAmounts = _dbContext.ConclaveSnapshots
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