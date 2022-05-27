namespace Conclave.Api.Exceptions.Services;

public class ConclaveSnapshotServiceNullException : Exception
{
    public ConclaveSnapshotServiceNullException() : base("ConclaveSnapshotService is null") { }
}
