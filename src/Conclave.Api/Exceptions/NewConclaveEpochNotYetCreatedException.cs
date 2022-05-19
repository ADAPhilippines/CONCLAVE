namespace Conclave.Api.Exceptions;


public class NewConclaveEpochNotYetCreatedException : Exception
{
    public override string Message => "New Conclave Epoch Not Yet Created";
}