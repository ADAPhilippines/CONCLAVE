namespace Conclave.Snapshot.Capture.Exceptions;


public class NewEpochNotYetCreatedException : Exception
{
    public override string Message => "New Epoch Not Yet Created";
}