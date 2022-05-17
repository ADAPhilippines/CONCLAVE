using Conclave.Snapshot.Server.Models;

namespace Conclave.Snapshot.Server.Interfaces.Services;


public interface IConclavePoolsService
{
    Task<List<Delegator>> GetPoolDelegatorsAsync(string poolId);
}