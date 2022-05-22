using Conclave.Api.Interfaces.Services;
using Conclave.Common.Models;
using Conclave.Data;

namespace Conclave.Api.Services;

public class ConclaveDelegatorService : IConclaveDelegatorService
{
    private readonly ApplicationDbContext _context;

    public ConclaveDelegatorService(ApplicationDbContext context)
    {
        _context = context;
    }
    public Task<ConclaveDelegator?> CreateAsync(ConclaveDelegator conclaveDelegator)
    {
        throw new NotImplementedException();
    }

    public Task<IEnumerable<ConclaveDelegator?>> CreateAsync(IEnumerable<ConclaveDelegator> conclaveDelegators)
    {
        throw new NotImplementedException();
    }

    public Task<ConclaveDelegator?> DeleteAsync(Guid id)
    {
        throw new NotImplementedException();
    }

    public IEnumerable<ConclaveDelegator?> GetAllByEpochNumber(ulong epochNumber)
    {
        var conclaveDelegators = _context.ConclaveDelegators
                                                .Where(c => c.ConclaveSnapshot.ConclaveEpoch.EpochNumber == epochNumber)
                                                .ToList();

        return conclaveDelegators;
    }

    public ConclaveDelegator? GetById(Guid id)
    {
        throw new NotImplementedException();
    }

    public ConclaveDelegator? GetByStakeAddress(string stakeAddress)
    {
        throw new NotImplementedException();
    }

    public ConclaveDelegator? GetByWalletAddress(string walletAddress)
    {
        throw new NotImplementedException();
    }

    public Task<ConclaveDelegator?> UpdateAsync(Guid id, ConclaveDelegator conclaveDelegator)
    {
        throw new NotImplementedException();
    }
}