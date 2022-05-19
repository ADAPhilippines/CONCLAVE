namespace Conclave.Snapshot.Server.Exceptions;


public class NextSnapshotCycleNotYetReadyException : Exception
{
    public override string Message => "Next snapshot cycle not yet ready!";
}