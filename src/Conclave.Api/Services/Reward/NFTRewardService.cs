using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Conclave.Data;

namespace Conclave.Api.Services;

public class NFTRewardService : INFTRewardService
{
    private readonly ApplicationDbContext _context;

    public NFTRewardService(ApplicationDbContext context)
    {
        _context = context;
    }
    public async Task<NFTReward> CreateAsync(NFTReward entity)
    {
        _context.Add(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public async Task<NFTReward?> DeleteAsync(Guid id)
    {
        var entity = _context.NFTRewards.Find(id);

        if (entity is null) return null;

        _context.Remove(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public IEnumerable<NFTReward> GetAll() => _context.NFTRewards.ToList() ?? new List<NFTReward>();
    
    public NFTReward? GetById(Guid id) => _context.NFTRewards.Find(id);
    
    public async Task<NFTReward?> UpdateAsync(Guid id, NFTReward entity)
    {
        var existing = _context.NFTRewards.Find(id);

        if (existing is null) return null;

        _context.Update(entity);
        await _context.SaveChangesAsync();

        return entity;
    }
}