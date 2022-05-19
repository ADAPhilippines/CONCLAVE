using Conclave.Common.Models;

namespace Conclave.Api.Interfaces.Services;


public interface IConclaveSnapshotService
{
    Task<ConclaveEpoch> PrepareNextSnapshotCycleAsync();
    Task<List<ConclaveSnapshot>> SnapshotPoolsAsync();
    HashSet<string?> GetSnapshottedStakingIdsForEpoch(long epochNumber);
}