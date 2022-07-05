using Conclave.Api.Interfaces;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Conclave.Data;
using Microsoft.EntityFrameworkCore;

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

    public IEnumerable<ConclaveOwnerReward>? GetAll()
    {
        return _context.ConclaveOwnerRewards.ToList();
    }

    public IEnumerable<ConclaveOwnerReward>? GetAllByEpochNumber(ulong epochNumber)
    {
        var result = _context.ConclaveOwnerRewards.Include(c => c.ConclaveOwnerSnapshot)
                                                  .ThenInclude(d => d.ConclaveEpoch)
                                                  .Where(c => c.ConclaveOwnerSnapshot.ConclaveEpoch.EpochNumber == epochNumber)
                                                  .ToList();

        return result;
    }

    public IEnumerable<ConclaveOwnerReward>? GetAllByStakeAddress(string stakeAddress)
    {
        var result = _context.ConclaveOwnerRewards.Include(c => c.ConclaveOwnerSnapshot)
                                                  .Where(c => c.ConclaveOwnerSnapshot.DelegatorSnapshot.StakeAddress == stakeAddress)
                                                  .ToList();

        return result;
    }

    public ConclaveOwnerReward? GetByStakeAddressAndEpochNumber(string stakeAddress, ulong epochNumber)
    {
        var result = _context.ConclaveOwnerRewards.Include(c => c.ConclaveOwnerSnapshot)
                                                  .ThenInclude(cs => cs.ConclaveEpoch)
                                                  .Where(c => c.ConclaveOwnerSnapshot.ConclaveEpoch.EpochNumber == epochNumber)
                                                  .Where(c => c.ConclaveOwnerSnapshot.DelegatorSnapshot.StakeAddress == stakeAddress)
                                                  .FirstOrDefault();

        return result;
    }

    public ConclaveOwnerReward? GetById(Guid id)
    {
        return _context.ConclaveOwnerRewards.Find(id);
    }

    public async Task<ConclaveOwnerReward?> UpdateAsync(Guid id, ConclaveOwnerReward entity)
    {
        var existing = _context.ConclaveOwnerRewards.Find(id);

        if (existing is null) return null;
       
        entity.DateUpdated = DateUtils.AddOffsetToUtc(DateTime.UtcNow);
        _context.Update(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public PendingReward GetPendingRewardsAsync(string stakeAddress){
        var pendingDelegatorRewards = _context.DelegatorRewards.Include(d => d.DelegatorSnapshot)
                                                               .Where(d => d.DelegatorSnapshot.StakeAddress == stakeAddress)
                                                               .Where(d => d.AirdropStatus == AirdropStatus.New)
                                                               .Select(d => d.RewardAmount)
                                                               .Sum();

        var pendingNftRewards = _context.NFTRewards.Include(n => n.NFTSnapshot)
                                                     .ThenInclude(s => s.DelegatorSnapshot)
                                                     .Where(n => n.NFTSnapshot.DelegatorSnapshot.StakeAddress == stakeAddress)
                                                     .Where(n => n.AirdropStatus == AirdropStatus.New)
                                                     .Select(n => n.RewardAmount)
                                                     .Sum();

        var pendingOwnerRewards = _context.ConclaveOwnerRewards.Include(o => o.ConclaveOwnerSnapshot)
                                                               .ThenInclude(s => s.DelegatorSnapshot)
                                                               .Where(o => o.ConclaveOwnerSnapshot.DelegatorSnapshot.StakeAddress == stakeAddress)
                                                               .Select(o => o.RewardAmount)
                                                               .Sum();

        return new PendingReward(stakeAddress, (pendingDelegatorRewards + pendingNftRewards + pendingOwnerRewards));
    }
}