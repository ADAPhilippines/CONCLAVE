using Conclave.Api.Interfaces.Services;
using Conclave.Common.Models;
using Conclave.Common.Utils;

namespace Conclave.Api.Services;


public class ConclaveSnapshotSchedulerService : IConclaveSnapshotSchedulerService
{
    public long GetNewEpochCreationDelayInMilliseconds(ConclaveEpoch conclaveEpoch, long delayInMilliseconds)
    {
        if (conclaveEpoch.EndTime is null) throw new Exception("End time not set!");
        var millisecondDifference = (long)(conclaveEpoch.EndTime - DateUtils.DateTimeToUtc(DateTime.Now)).Value.TotalMilliseconds;
        return millisecondDifference - delayInMilliseconds;
    }

    public long GetSnapshotDelayInMilliseconds(ConclaveEpoch conclaveEpoch, long delayInMilliseconds)
    {
        if (conclaveEpoch.EndTime is null) throw new Exception("End time not set!");
        var millisecondDifference = (long)(conclaveEpoch.EndTime - DateUtils.DateTimeToUtc(DateTime.Now)).Value.TotalMilliseconds;
        return millisecondDifference - delayInMilliseconds;
    }
}