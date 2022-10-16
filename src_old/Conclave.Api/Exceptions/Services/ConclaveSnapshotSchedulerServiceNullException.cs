namespace Conclave.Api.Exceptions.Services;

public class ConclaveSnapshotSchedulerServiceNullException : Exception
{
    public ConclaveSnapshotSchedulerServiceNullException() : base("ConclaveSnapshotSchedulerService is null") { }
}
