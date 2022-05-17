using Conclave.Snapshot.Server.Models;

namespace Conclave.Snapshot.Server.Interfaces.Services;


public interface IConclaveSnapshotService
{
    Task<List<ConclaveSnapshot>> SnapshotPoolsAsync();
}