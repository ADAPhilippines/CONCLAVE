using Conclave.Snapshot.Server.Models;

namespace Conclave.Snapshot.Server.Interfaces.Services;


public interface IConclaveEpochsService
{
    Task<Epoch> GetCurrentEpoch(string poolId);
}