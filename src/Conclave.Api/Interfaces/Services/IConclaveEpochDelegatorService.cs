using Conclave.Common.Models;

namespace Conclave.Api.Interfaces.Services;


public interface IConclaveEpochDelegatorService
{

    // READ
    IEnumerable<ConclaveEpochDelegator?> GetAllByEpochNumber(ulong epochNumber);
    ConclaveEpochDelegator? GetById(Guid id);
    ConclaveEpochDelegator? GetByStakeAddress(string stakeAddress);
    ConclaveEpochDelegator? GetByWalletAddress(string walletAddress);

    // WRITE

    Task<ConclaveEpochDelegator?> CreateAsync(ConclaveEpochDelegator conclaveDelegator);
    Task<IEnumerable<ConclaveEpochDelegator?>> CreateAsync(IEnumerable<ConclaveEpochDelegator> conclaveDelegators);
    Task<ConclaveEpochDelegator?> UpdateAsync(Guid id, ConclaveEpochDelegator conclaveDelegator);
    Task<ConclaveEpochDelegator?> DeleteAsync(Guid id);
}