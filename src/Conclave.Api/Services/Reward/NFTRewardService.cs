using Conclave.Api.Interfaces;
using Conclave.Common.Enums;
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

    public IEnumerable<NFTReward>? GetAll()
    {
        return _context.NFTRewards.ToList();
    }

    public IEnumerable<NFTReward>? GetAllByAirdropStatus(AirdropStatus status)
    {
        return _context.NFTRewards.Include(n => n.NFTSnapshot)
                                  .ThenInclude(s => s.DelegatorSnapshot)
                                  .Where(n => n.AirdropStatus == status)
                                  .ToList();
    }

    public IEnumerable<NFTReward>? GetAllByEpochNumber(ulong epochNumber)
    {
        var result = _context.NFTRewards.Include(n => n.NFTSnapshot)
                                        .ThenInclude(ns => ns.ConclaveEpoch)
                                        .Where(n => n.NFTSnapshot.ConclaveEpoch.EpochNumber == epochNumber)
                                        .ToList();

        return result;
    }

    public IEnumerable<NFTReward>? GetAllByStakeAddress(string stakeAddress)
    {
        var result = _context.NFTRewards.Include(n => n.NFTSnapshot)
                                        .ThenInclude(ns => ns.DelegatorSnapshot)
                                        .Where(n => n.NFTSnapshot.DelegatorSnapshot.StakeAddress == stakeAddress)
                                        .ToList();

        return result;
    }

    public IEnumerable<NFTReward>? GetAllByStakeAddressAndEpochNumber(string stakeAddress, ulong epochNumber)
    {
        var result = _context.NFTRewards.Include(n => n.NFTSnapshot)
                                        .ThenInclude(ns => ns.DelegatorSnapshot)
                                        .ThenInclude(ds => ds.ConclaveEpoch)
                                        .Where(n => n.NFTSnapshot.DelegatorSnapshot.StakeAddress == stakeAddress)
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

        entity.DateUpdated = DateUtils.AddOffsetToUtc(DateTime.UtcNow);
        _context.Update(entity);
        await _context.SaveChangesAsync();

        return entity;
    }
}