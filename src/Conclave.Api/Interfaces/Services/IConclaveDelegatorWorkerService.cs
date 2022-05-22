using Conclave.Common.Models;

namespace Conclave.Api.Interfaces.Services;

public interface IConclaveDelegatorWorkerService
{
    Task<IEnumerable<ConclaveDelegator?>> GetAllConclaveDelegatorsFromSnapshotListAsync(IEnumerable<ConclaveSnapshot?> snapshots);
    Task<IEnumerable<ConclaveDelegator?>> StoreConclaveDelegatorsAsync(IEnumerable<ConclaveDelegator?> conclaveDelegators);
}