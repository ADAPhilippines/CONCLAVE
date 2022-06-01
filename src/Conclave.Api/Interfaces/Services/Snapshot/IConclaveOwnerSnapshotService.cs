using Conclave.Common.Models;

namespace Conclave.Api.Interfaces;

public interface IConclaveOwnerSnapshotService : IRepository<ConclaveOwnerSnapshot, Guid>
{
    IEnumerable<ConclaveOwnerSnapshot> GetAllByEpochNumber(ulong epochNumber);
}