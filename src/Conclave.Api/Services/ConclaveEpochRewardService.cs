using Conclave.Api.Interfaces.Services;
using Conclave.Common.Models;
using Conclave.Data;
using Microsoft.EntityFrameworkCore;

namespace Conclave.Api.Services;

public class ConclaveEpochRewardService : IConclaveEpochRewardService
{
    private readonly ApplicationDbContext _context;

    public ConclaveEpochRewardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ConclaveEpochReward> CreateAsync(ConclaveEpochReward conclaveEpochReward)
    {
        _context.Add(conclaveEpochReward);
        await _context.SaveChangesAsync();

        return conclaveEpochReward;
    }

    public Task<ConclaveEpochReward> DeleteAsync(Guid id)
    {
        throw new NotImplementedException();
    }

    public ConclaveEpochReward? GetByEpochNumber(ulong epochNumber)
    {
        var epochReward = _context.ConclaveEpochRewards.Where(c => c.EpochNumber == epochNumber)
                                                         .FirstOrDefault();


        return epochReward;
    }

    public ConclaveEpochReward GetById(Guid Id)
    {
        throw new NotImplementedException();
    }

    public async Task<ConclaveEpochReward> UpdateAsync(Guid id, ConclaveEpochReward conclaveEpochReward)
    {
        if (id == conclaveEpochReward.Id) throw new Exception("Ids do not match");

        _context.Update(conclaveEpochReward);
        await _context.SaveChangesAsync();

        return conclaveEpochReward;
    }
}