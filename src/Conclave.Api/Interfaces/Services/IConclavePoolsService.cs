using Conclave.Common.Models;

namespace Conclave.Api.Interfaces.Services;


public interface IConclavePoolsService
{
    Task<List<Delegator>> GetPoolDelegatorsAsync(string poolId, int? count, int? page);
    Task<List<Delegator>> GetAllUniquePoolDelegatorsAsync();
}