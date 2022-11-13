using Conclave.Common.Models;

namespace Conclave.Api.Interfaces;


public interface IConclaveSchedulerService
{
    long GetSnapshotDelayInMilliseconds(ConclaveEpoch conclaveEpoch, long delayInMilliseconds);
    long GetNewEpochCreationDelayInMilliseconds(ConclaveEpoch conclaveEpoch, long delayInMilliseconds);
    long GetPoolOwnerRewardDelayInMilliseconds(ConclaveEpoch conclaveEpoch, long delayInMilliseconds);
}