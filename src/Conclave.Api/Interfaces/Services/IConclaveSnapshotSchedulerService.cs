using Conclave.Common.Models;

namespace Conclave.Api.Interfaces.Services;


public interface IConclaveSnapshotSchedulerService
{
    Task<long> GetSnapshotDelay(ConclaveEpoch conclaveEpoch, long delayInMilliseconds);
}