namespace Conclave.Api.Exceptions;


public class NextSnapshotCycleNotYetReadyException : Exception
{
    public override string Message => "Next snapshot cycle not yet ready!";
}