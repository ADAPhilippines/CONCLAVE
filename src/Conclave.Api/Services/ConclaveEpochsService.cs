using Blockfrost.Api.Services;
using Conclave.Api.Interfaces;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Conclave.Data;

namespace Conclave.Api.Services;

public class ConclaveEpochsService : IConclaveEpochsService
{
    private readonly ApplicationDbContext _context;

    public ConclaveEpochsService(ApplicationDbContext context)
    {
        _context = context;
    }

    // public IEnumerable<ConclaveEpoch> GetByAirdropStatus(AirdropStatus airdropStatus)
    // {
    //     throw new NotImplementedException();
    // }

    public IEnumerable<ConclaveEpoch> GetByAllStatus(
        EpochStatus epochStatus,
        SnapshotStatus snapshotStatus,
        RewardStatus rewardStatus,
        AirdropStatus airdropStatus)
    {
        throw new NotImplementedException();
    }

    public ConclaveEpoch? GetByEpochNumber(ulong epochNumber)
    {
        return _context.ConclaveEpochs.Where(c => c.EpochNumber == epochNumber).FirstOrDefault();
    }

    public IEnumerable<ConclaveEpoch> GetByEpochStatus(EpochStatus epochStatus)
    {
        var epochsByStatus = _context.ConclaveEpochs.Where(e => e.EpochStatus == epochStatus).ToList();
        return epochsByStatus ?? new List<ConclaveEpoch>();
    }

    public ConclaveEpoch? GetById(Guid id) => _context.ConclaveEpochs.Find(id);

    // public IEnumerable<ConclaveEpoch> GetByRewardStatus(RewardStatus rewardStatus)
    // {
    //     throw new NotImplementedException();
    // }

    // public IEnumerable<ConclaveEpoch> GetBySnapshotStatus(SnapshotStatus snapshotStatus)
    // {
    //     throw new NotImplementedException();
    // }

    public async Task<ConclaveEpoch> CreateAsync(ConclaveEpoch conclaveEpoch)
    {
        _context.Add(conclaveEpoch);
        await _context.SaveChangesAsync();
        return conclaveEpoch;
    }

    public async Task<ConclaveEpoch?> DeleteByEpochNumber(ulong epochNumber)
    {
        var epoch = _context.ConclaveEpochs.Where(t => t.EpochNumber == epochNumber).FirstOrDefault();

        if (epoch == null) return null;

        _context.ConclaveEpochs.Remove(epoch);
        await _context.SaveChangesAsync();

        return epoch;
    }

    public IEnumerable<ConclaveEpoch> GetAll()
    {
        return _context.ConclaveEpochs.ToList() ?? new List<ConclaveEpoch>();
    }

    public async Task<ConclaveEpoch?> UpdateAsync(Guid id, ConclaveEpoch entity)
    {
        if (id != entity.Id) throw new Exception("Ids do not match");

        _context.Update(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public async Task<ConclaveEpoch?> DeleteAsync(Guid id)
    {
        var epoch = _context.ConclaveEpochs.Where(t => t.Id == id).FirstOrDefault();

        if (epoch == null) return null;

        _context.ConclaveEpochs.Remove(epoch);
        await _context.SaveChangesAsync();

        return epoch;
    }
}
