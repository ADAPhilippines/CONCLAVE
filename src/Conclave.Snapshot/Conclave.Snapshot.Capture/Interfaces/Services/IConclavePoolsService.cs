using Conclave.Common.Models;

namespace Conclave.Snapshot.Capture.Interfaces.Services;


public interface IConclavePoolsService
{
    Task<List<Delegator>> GetPoolDelegatorsAsync(string poolId);
}