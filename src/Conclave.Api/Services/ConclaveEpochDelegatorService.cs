using Conclave.Api.Interfaces.Services;
using Conclave.Common.Models;
using Conclave.Data;
using Microsoft.EntityFrameworkCore;

namespace Conclave.Api.Services;

public class ConclaveEpochDelegatorService : IConclaveEpochDelegatorService
{
    private readonly ApplicationDbContext _context;

    public ConclaveEpochDelegatorService(ApplicationDbContext context)
    {
        _context = context;
    }
    public Task<ConclaveEpochDelegator?> CreateAsync(ConclaveEpochDelegator conclaveDelegator)
    {
        throw new NotImplementedException();
    }

    public Task<IEnumerable<ConclaveEpochDelegator?>> CreateAsync(IEnumerable<ConclaveEpochDelegator> conclaveDelegators)
    {
        throw new NotImplementedException();
    }

    public Task<ConclaveEpochDelegator?> DeleteAsync(Guid id)
    {
        throw new NotImplementedException();
    }

    public IEnumerable<ConclaveEpochDelegator?> GetAllByEpochNumber(ulong epochNumber)
    {
        var conclaveDelegators = _context.ConclaveEpochDelegators
                                                .Where(c => c.ConclaveSnapshot.ConclaveEpoch.EpochNumber == epochNumber)
                                                .Include(x => x.ConclaveSnapshot)
                                                .ToList();

        return conclaveDelegators;
    }

    public ConclaveEpochDelegator? GetById(Guid id)
    {
        throw new NotImplementedException();
    }

    public ConclaveEpochDelegator? GetByStakeAddress(string stakeAddress)
    {
        throw new NotImplementedException();
    }

    public ConclaveEpochDelegator? GetByWalletAddress(string walletAddress)
    {
        throw new NotImplementedException();
    }

    public Task<ConclaveEpochDelegator?> UpdateAsync(Guid id, ConclaveEpochDelegator conclaveDelegator)
    {
        throw new NotImplementedException();
    }
}