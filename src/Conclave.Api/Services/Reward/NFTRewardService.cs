using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Conclave.Data;
using Microsoft.EntityFrameworkCore;

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

    public IEnumerable<NFTReward>? GetAll() => _context.NFTRewards.ToList();

    public IEnumerable<NFTReward>? GetAllByEpochNumber(ulong epochNumber)
    {
        var result = _context.NFTRewards.Include(n => n.NFTSnapshot)
                                        .ThenInclude(s => s.ConclaveEpoch)
                                        .Where(n => n.NFTSnapshot.ConclaveEpoch.EpochNumber == epochNumber)
                                        .ToList();

        return result;
    }

    public NFTReward? GetById(Guid id)
    {
        return _context.NFTRewards.Find(id);
    }

    public async Task<NFTReward?> UpdateAsync(Guid id, NFTReward entity)
    {
        var existing = _context.NFTRewards.Find(id);

        if (existing is null) return null;

        entity.DateUpdated = DateUtils.DateTimeToUtc(DateTime.Now);
        _context.Update(entity);
        await _context.SaveChangesAsync();

        return entity;
    }
}