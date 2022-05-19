namespace Conclave.Snapshot.Server.Exceptions;


public class SeedEpochNotYetCreatedException : Exception
{
    public override string Message => "Seed epoch not yet created!";
}