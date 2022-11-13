using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Conclave.Common.Utils;

namespace Conclave.Api.Services;


public class ConclaveSnapshotSchedulerService : IConclaveSchedulerService
{
    public long GetNewEpochCreationDelayInMilliseconds(ConclaveEpoch conclaveEpoch, long delayInMilliseconds)
    {
        return DateUtils.GetTimeDifferenceFromNowInMilliseconds(conclaveEpoch.EndTime) + delayInMilliseconds;
    }

    public long GetSnapshotDelayInMilliseconds(ConclaveEpoch conclaveEpoch, long delayInMilliseconds)
    {
        return DateUtils.GetTimeDifferenceFromNowInMilliseconds(conclaveEpoch.EndTime) - delayInMilliseconds;
    }

    public long GetPoolOwnerRewardDelayInMilliseconds(ConclaveEpoch conclaveEpoch, long delayInMilliseconds)
    {
        return DateUtils.GetTimeDifferenceFromNowInMilliseconds(conclaveEpoch.EndTime) + 864000000 + delayInMilliseconds;
    }
}