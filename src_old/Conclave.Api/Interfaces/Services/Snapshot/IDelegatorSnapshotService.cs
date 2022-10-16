using Conclave.Common.Models;

namespace Conclave.Api.Interfaces;

public interface IDelegatorSnapshotService : IRepository<DelegatorSnapshot, Guid>
{
    IEnumerable<DelegatorSnapshot>? GetAllByEpochNumber(ulong epochNumber);
}
