using Conclave.Api.Interfaces.Services;
using Conclave.Common.Models;

namespace Conclave.Api.Services;


public class ConclaveSnapshotSchedulerService : IConclaveSnapshotSchedulerService
{
    public Task<long> GetSnapshotDelay(ConclaveEpoch conclaveEpoch, long delayInMilliseconds)
    {
        throw new NotImplementedException();
    }
}