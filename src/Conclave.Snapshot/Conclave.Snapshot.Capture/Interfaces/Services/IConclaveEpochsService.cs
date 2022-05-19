using Conclave.Common.Enums;
using Conclave.Common.Models;

namespace Conclave.Snapshot.Capture.Interfaces.Services;


public interface IConclaveEpochsService
{
    Task<Epoch> GetCurrentEpochAsync();
    Task<ConclaveEpoch> CreateSeedEpochAsync();
    List<ConclaveEpoch> GetConclaveEpochsByEpochStatus(EpochStatus status);
}