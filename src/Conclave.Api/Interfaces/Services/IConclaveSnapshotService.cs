using Conclave.Common.Models;

namespace Conclave.Api.Interfaces.Services;


public interface IConclaveSnapshotService
{

    // READ
    IEnumerable<ConclaveSnapshot?> GetByEpochNumber(ulong epochNumber);
    Task<IEnumerable<ConclaveSnapshot?>> GetByStakingAddress(string stakingAddress);
    Task<ConclaveSnapshot?> GetById(Guid id);

    //WRITE
    Task<ConclaveSnapshot?> CreateAsync(ConclaveSnapshot conclaveSnapshot);
    Task<ConclaveSnapshot?> DeleteAsync(Guid id);
    Task<ConclaveSnapshot?> UpdateAsync(Guid id, ConclaveSnapshot conclaveSnapshot);
}