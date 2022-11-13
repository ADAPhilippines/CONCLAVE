namespace Conclave.Api.Exceptions.Options;

public class SnapshotOptionNullException : Exception
{
    public SnapshotOptionNullException() : base("SnapshotOption is null") { }
}