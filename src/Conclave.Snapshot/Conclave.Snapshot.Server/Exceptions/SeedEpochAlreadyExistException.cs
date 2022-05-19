namespace Conclave.Snapshot.Server.Exceptions;


public class SeedEpochAlreadyCreatedException : Exception
{
    public override string Message => "Seed epoch already exists!";
}