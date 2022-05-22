using Conclave.Common.Models;

namespace Conclave.Api.Interfaces.Services;


public interface IConclaveDelegatorService
{

// READ
IEnumerable<ConclaveDelegator?> GetAllByEpochNumber(ulong epochNumber);
ConclaveDelegator? GetById(Guid id);
ConclaveDelegator? GetByStakeAddress(string stakeAddress);
ConclaveDelegator? GetByWalletAddress(string walletAddress);

// WRITE

Task<ConclaveDelegator?> CreateAsync(ConclaveDelegator conclaveDelegator);
Task<IEnumerable<ConclaveDelegator?>> CreateAsync(IEnumerable<ConclaveDelegator> conclaveDelegators);
Task<ConclaveDelegator?> UpdateAsync(Guid id, ConclaveDelegator conclaveDelegator);
Task<ConclaveDelegator?> DeleteAsync(Guid id);
}