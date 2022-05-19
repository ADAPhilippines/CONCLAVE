namespace Conclave.Snapshot.Capture.Exceptions;


public class SnapshotTooEarlyException : Exception
{
    public override string Message => "Snapshot too early!";
}