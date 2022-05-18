using Conclave.Snapshot.Server.Enums;
using Conclave.Snapshot.Server.Models;

namespace Conclave.Snapshot.Server.Interfaces.Services;


public interface IConclaveEpochsService
{
    Task<Epoch> GetCurrentEpochAsync();
    Task<ConclaveEpoch> CreateSeedEpochAsync();
    List<ConclaveEpoch> GetConclaveEpochsByEpochStatus(EpochStatus status);
}