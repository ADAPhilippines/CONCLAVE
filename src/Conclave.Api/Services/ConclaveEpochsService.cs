using Blockfrost.Api.Services;
using Conclave.Api.Exceptions;
using Conclave.Api.Interfaces.Services;
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

    public IEnumerable<ConclaveEpoch?> GetByAirdropStatus(AirdropStatus airdropStatus)
    {
        throw new NotImplementedException();
    }

    public IEnumerable<ConclaveEpoch?> GetByAllStatus(EpochStatus epochStatus, SnapshotStatus snapshotStatus, RewardStatus rewardStatus, AirdropStatus airdropStatus)
    {
        throw new NotImplementedException();
    }

    public ConclaveEpoch? GetByEpochNumber(ulong epochNumber)
    {
        throw new NotImplementedException();
    }

    public IEnumerable<ConclaveEpoch?> GetByEpochStatus(EpochStatus epochStatus)
    {
        var epochsByStatus = _context.ConclaveEpochs.Where(e => e.EpochStatus == epochStatus).ToList();
        return epochsByStatus;
    }

    public ConclaveEpoch? GetById(Guid id)
    {
        throw new NotImplementedException();
    }

    public IEnumerable<ConclaveEpoch?> GetByRewardStatus(RewardStatus rewardStatus)
    {
        throw new NotImplementedException();
    }

    public IEnumerable<ConclaveEpoch?> GetBySnapshotStatus(SnapshotStatus snapshotStatus)
    {
        throw new NotImplementedException();
    }

    public async Task<ConclaveEpoch?> CreateAsync(ConclaveEpoch conclaveEpoch)
    {
        _context.Add(conclaveEpoch);
        await _context.SaveChangesAsync();
        return conclaveEpoch;
    }

    public async Task<IEnumerable<ConclaveEpoch?>> CreateAsync(IEnumerable<ConclaveEpoch?> conclaveEpochList)
    {

        foreach (var conclaveEpoch in conclaveEpochList)
        {
            if (conclaveEpoch is null) continue;
            _context.ConclaveEpochs.Add(conclaveEpoch);
        }

        await _context.SaveChangesAsync();
        return conclaveEpochList;
    }

    public Task<ConclaveEpoch?> DeleteByEpochNumber(ulong epochNumber)
    {
        throw new NotImplementedException();
    }

    public Task<ConclaveEpoch?> DeleteById(Guid id)
    {
        throw new NotImplementedException();
    }
    public async Task<ConclaveEpoch?> Update(Guid id, ConclaveEpoch conclaveEpoch)
    {
        if (id != conclaveEpoch.Id) throw new Exception("Ids do not match");

        _context.Update(conclaveEpoch);
        await _context.SaveChangesAsync();

        return conclaveEpoch;
    }
}
