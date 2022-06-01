using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Conclave.Data;
using Microsoft.EntityFrameworkCore;

namespace Conclave.Api.Services;

public class OperatorRewardService : IOperatorRewardService
{
    private readonly ApplicationDbContext _context;

    public OperatorRewardService(ApplicationDbContext context)
    {
        _context = context;
    }
    public async Task<OperatorReward> CreateAsync(OperatorReward entity)
    {
        _context.Add(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public async Task<OperatorReward?> DeleteAsync(Guid id)
    {
        var entity = _context.OperatorRewards.Find(id);

        if (entity is null) return null;

        _context.Remove(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public IEnumerable<OperatorReward>? GetAll()
    {
        return _context.OperatorRewards.ToList();
    }

    public IEnumerable<OperatorReward>? GetAllByEpochNumber(ulong epochNumber)
    {

        var result = _context.OperatorRewards.Include(o => o.OperatorSnapshot)
                                             .ThenInclude(s => s.ConclaveEpoch)
                                             .Where(n => n.OperatorSnapshot.ConclaveEpoch.EpochNumber == epochNumber)
                                             .ToList();

        return result;
    }

    public OperatorReward? GetById(Guid id)
    {
        return _context.OperatorRewards.Find(id);
    }

    public async Task<OperatorReward?> UpdateAsync(Guid id, OperatorReward entity)
    {
        var existing = _context.OperatorRewards.Find(id);

        if (existing is null) return null;

        _context.Update(entity);
        await _context.SaveChangesAsync();

        return entity;
    }
}