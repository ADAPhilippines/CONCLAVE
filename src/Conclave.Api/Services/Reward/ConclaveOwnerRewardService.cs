using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Conclave.Data;

namespace Conclave.Api.Services;

public class ConclaveOwnerRewardService : IConclaveOwnerRewardService
{
    private readonly ApplicationDbContext _context;

    public ConclaveOwnerRewardService(ApplicationDbContext context)
    {
        _context = context;
    }
    public async Task<ConclaveOwnerReward> CreateAsync(ConclaveOwnerReward entity)
    {
        _context.Add(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public async Task<ConclaveOwnerReward?> DeleteAsync(Guid id)
    {
        var entity = _context.ConclaveOwnerRewards.Find(id);

        if (entity is null) return null;

        _context.Remove(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public IEnumerable<ConclaveOwnerReward> GetAll() => _context.ConclaveOwnerRewards.ToList() ?? new List<ConclaveOwnerReward>();
    
    public ConclaveOwnerReward? GetById(Guid id) => _context.ConclaveOwnerRewards.Find(id);
    
    public async Task<ConclaveOwnerReward?> UpdateAsync(Guid id, ConclaveOwnerReward entity)
    {
        var existing = _context.ConclaveOwnerRewards.Find(id);

        if (existing is null) return null;

        _context.Update(entity);
        await _context.SaveChangesAsync();

        return entity;
    }
}