namespace Conclave.Api.Exceptions.Services;
public class ConclaveSnapshotWorkerServiceNullException : Exception
{
    public ConclaveSnapshotWorkerServiceNullException() : base("ConclaveSnapshotWorkerService is null") { }
}
