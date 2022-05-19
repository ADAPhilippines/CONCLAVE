namespace Conclave.Snapshot.Server.Exceptions;


public class SnapshotTooEarlyException : Exception
{
    public override string Message => "Snapshot too early!";
}