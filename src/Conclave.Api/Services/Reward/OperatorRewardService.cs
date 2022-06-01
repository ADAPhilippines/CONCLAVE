using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Conclave.Data;

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

    public IEnumerable<OperatorReward> GetAll() => _context.OperatorRewards.ToList() ?? new List<OperatorReward>();

    public OperatorReward? GetById(Guid id) => _context.OperatorRewards.Find(id);

    public async Task<OperatorReward?> UpdateAsync(Guid id, OperatorReward entity)
    {
        var existing = _context.OperatorRewards.Find(id);

        if (existing is null) return null;

        entity.DateUpdated = DateUtils.DateTimeToUtc(DateTime.Now);
        _context.Update(entity);
        await _context.SaveChangesAsync();

        return entity;
    }
}