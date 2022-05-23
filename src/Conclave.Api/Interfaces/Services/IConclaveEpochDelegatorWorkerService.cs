using Conclave.Common.Models;

namespace Conclave.Api.Interfaces.Services;

public interface IConclaveEpochDelegatorWorkerService
{
    Task<IEnumerable<ConclaveEpochDelegator?>> GetAllConclaveDelegatorsFromSnapshotListAsync(IEnumerable<ConclaveSnapshot?> snapshots);
    Task<IEnumerable<ConclaveEpochDelegator?>> StoreConclaveDelegatorsAsync(IEnumerable<ConclaveEpochDelegator?> conclaveDelegators);
}