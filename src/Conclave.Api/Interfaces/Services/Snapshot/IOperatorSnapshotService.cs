using Conclave.Common.Models;

namespace Conclave.Api.Interfaces;

public interface IOperatorSnapshotService : IRepository<OperatorSnapshot, Guid>
{
    IEnumerable<OperatorSnapshot> GetAllByEpochNumber(ulong epochNumber);
}