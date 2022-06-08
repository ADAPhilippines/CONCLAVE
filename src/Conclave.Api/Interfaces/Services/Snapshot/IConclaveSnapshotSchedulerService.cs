using Conclave.Common.Models;

namespace Conclave.Api.Interfaces;


public interface IConclaveSnapshotSchedulerService
{
    long GetSnapshotDelayInMilliseconds(ConclaveEpoch conclaveEpoch, long delayInMilliseconds);
    long GetNewEpochCreationDelayInMilliseconds(ConclaveEpoch conclaveEpoch, long delayInMilliseconds);
}