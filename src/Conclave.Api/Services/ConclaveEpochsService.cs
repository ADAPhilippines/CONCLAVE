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
    private readonly IEpochsService _service;
    private readonly ApplicationDbContext _context;

    public ConclaveEpochsService(IEpochsService service, ApplicationDbContext context)
    {
        _service = service;
        _context = context;
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

    public Task<IEnumerable<ConclaveEpoch?>> GetByAirdropStatus(AirdropStatus airdropStatus)
    {
        throw new NotImplementedException();
    }

    public Task<IEnumerable<ConclaveEpoch?>> GetByAllStatus(EpochStatus epochStatus, SnapshotStatus snapshotStatus, RewardStatus rewardStatus, AirdropStatus airdropStatus)
    {
        throw new NotImplementedException();
    }

    public Task<ConclaveEpoch?> GetByEpochNumber(ulong epochNumber)
    {
        throw new NotImplementedException();
    }

    public Task<IEnumerable<ConclaveEpoch?>> GetByEpochStatus(EpochStatus epochStatus)
    {
        throw new NotImplementedException();
    }

    public Task<ConclaveEpoch?> GetById(Guid id)
    {
        throw new NotImplementedException();
    }

    public Task<IEnumerable<ConclaveEpoch?>> GetByRewardStatus(RewardStatus rewardStatus)
    {
        throw new NotImplementedException();
    }

    public Task<IEnumerable<ConclaveEpoch?>> GetBySnapshotStatus(SnapshotStatus snapshotStatus)
    {
        throw new NotImplementedException();
    }

    public Task<ConclaveEpoch?> Update(ConclaveEpoch conclaveEpoch)
    {
        throw new NotImplementedException();
    }
}
