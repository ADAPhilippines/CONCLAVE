namespace Conclave.Api.Exceptions;


public class SeedEpochAlreadyCreatedException : Exception
{
    public override string Message => "Seed epoch already exists!";
}