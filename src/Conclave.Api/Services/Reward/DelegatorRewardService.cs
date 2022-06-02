using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Conclave.Data;
using Microsoft.EntityFrameworkCore;

namespace Conclave.Api.Services;

public class DelegatorRewardService : IDelegatorRewardService
{
    private readonly ApplicationDbContext _context;

    public DelegatorRewardService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DelegatorReward> CreateAsync(DelegatorReward entity)
    {
        _context.Add(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public async Task<DelegatorReward?> DeleteAsync(Guid id)
    {
        var entity = _context.DelegatorRewards.Find(id);

        if (entity is null) return null;

        _context.Remove(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public IEnumerable<DelegatorReward> GetAll() => _context.DelegatorRewards.ToList() ?? new List<DelegatorReward>();

    public IEnumerable<DelegatorReward>? GetAllByEpochNumber(ulong epochNumber)
    {
        var result = _context.DelegatorRewards.Include(d => d.DelegatorSnapshot)
                                              .ThenInclude(d => d.ConclaveEpoch)
                                              .Where(d => d.DelegatorSnapshot.ConclaveEpoch.EpochNumber == epochNumber)
                                              .ToList();

        return result;
    }

    public DelegatorReward? GetById(Guid id)
    {
        return _context.DelegatorRewards.Find(id);
    }

    public async Task<DelegatorReward?> UpdateAsync(Guid id, DelegatorReward entity)
    {
        var existing = _context.DelegatorRewards.Find(id);

        if (existing is null) return null;

        entity.DateUpdated = DateUtils.DateTimeToUtc(DateTime.Now);
        _context.Update(entity);
        await _context.SaveChangesAsync();

        return entity;
    }
}