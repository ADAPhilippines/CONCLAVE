using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Conclave.Data;

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

    public DelegatorReward? GetById(Guid id) => _context.DelegatorRewards.Find(id);

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