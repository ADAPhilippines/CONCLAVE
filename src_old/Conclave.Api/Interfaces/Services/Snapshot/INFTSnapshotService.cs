using Conclave.Common.Models;

namespace Conclave.Api.Interfaces;

public interface INFTSnapshotService : IRepository<NFTSnapshot, Guid>
{
    IEnumerable<NFTSnapshot>? GetAllByEpochNumber(ulong epochNumber);
}