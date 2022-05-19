namespace Conclave.Api.Exceptions;


public class NewConclaveEpochAlreadyCreatedException : Exception
{
    public override string Message => "New Conclave Epoch Not Yet Created";
}