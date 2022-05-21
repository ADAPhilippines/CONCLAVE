using Conclave.Common.Models;

namespace Conclave.Api.Interfaces.Services;


public interface IConclaveSnapshotWorkerService
{

    // READ
    Task<IEnumerable<ConclaveSnapshot?>> SnapshotDelegatorsForPoolAsync(string poolId, ConclaveEpoch conclaveEpoch);
    Task<IEnumerable<ConclaveSnapshot?>> SnapshotUniqueDelegatorsForPoolAsync(string poolId, ConclaveEpoch conclaveEpoch);
    Task<IEnumerable<ConclaveSnapshot?>> SnapshotDelegatorsForPoolsAsync(IEnumerable<string> poolIds, ConclaveEpoch conclaveEpoch);
    Task<IEnumerable<ConclaveSnapshot?>> SnapshotUniqueDelegatorsForPoolsAsync(IEnumerable<string> poolIds, ConclaveEpoch conclaveEpoch);

    // WRITE
    Task<IEnumerable<ConclaveSnapshot>> StoreSnapshotDataAsync(IEnumerable<ConclaveSnapshot?> snapshotList);
}