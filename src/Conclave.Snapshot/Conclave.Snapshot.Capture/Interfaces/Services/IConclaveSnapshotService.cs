using Conclave.Common.Models;
namespace Conclave.Snapshot.Capture.Interfaces.Services;


public interface IConclaveSnapshotService
{
    Task<ConclaveEpoch> PrepareNextSnapshotCycleAsync();
    Task<List<ConclaveSnapshot>> SnapshotPoolsAsync();
}