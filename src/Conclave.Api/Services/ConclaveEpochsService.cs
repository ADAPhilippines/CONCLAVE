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

    public IEnumerable<ConclaveEpoch> GetByAirdropStatus(AirdropStatus airdropStatus)
    {
        throw new NotImplementedException();
    }

    public IEnumerable<ConclaveEpoch> GetByAllStatus(EpochStatus epochStatus, SnapshotStatus snapshotStatus, RewardStatus rewardStatus, AirdropStatus airdropStatus)
    {
        throw new NotImplementedException();
    }

    public ConclaveEpoch? GetByEpochNumber(ulong epochNumber)
    {
        return _context.ConclaveEpochs.Where(c => c.EpochNumber == epochNumber).FirstOrDefault(); ;
    }

    public IEnumerable<ConclaveEpoch> GetByEpochStatus(EpochStatus epochStatus)
    {
        var epochsByStatus = _context.ConclaveEpochs.Where(e => e.EpochStatus == epochStatus).ToList();
        return epochsByStatus;
    }

    public ConclaveEpoch GetById(Guid id)
    {
        throw new NotImplementedException();
    }

    public IEnumerable<ConclaveEpoch> GetByRewardStatus(RewardStatus rewardStatus)
    {
        throw new NotImplementedException();
    }

    public IEnumerable<ConclaveEpoch> GetBySnapshotStatus(SnapshotStatus snapshotStatus)
    {
        throw new NotImplementedException();
    }

    public async Task<ConclaveEpoch> CreateAsync(ConclaveEpoch conclaveEpoch)
    {
        _context.Add(conclaveEpoch);
        await _context.SaveChangesAsync();
        return conclaveEpoch;
    }

    public Task<ConclaveEpoch> DeleteByEpochNumber(ulong epochNumber)
    {
        throw new NotImplementedException();
    }

    public IEnumerable<ConclaveEpoch>? GetAll()
    {
        throw new NotImplementedException();
    }

    public async Task<ConclaveEpoch?> UpdateAsync(Guid id, ConclaveEpoch entity)
    {
        if (id != entity.Id) throw new Exception("Ids do not match");

        _context.Update(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public Task<ConclaveEpoch?> DeleteAsync(Guid id)
    {
        throw new NotImplementedException();
    }
}
