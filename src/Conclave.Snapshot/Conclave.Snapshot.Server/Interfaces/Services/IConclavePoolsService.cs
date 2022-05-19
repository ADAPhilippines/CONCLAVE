using Conclave.Common.Models;

namespace Conclave.Snapshot.Server.Interfaces.Services;


public interface IConclavePoolsService
{
    Task<List<Delegator>> GetPoolDelegatorsAsync(string poolId);
}