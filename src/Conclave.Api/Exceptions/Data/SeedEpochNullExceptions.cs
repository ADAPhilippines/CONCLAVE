namespace Conclave.Api.Exceptions.Data;

public class SeedEpochNullException : Exception
{
    public SeedEpochNullException() : base("SeedEpoch is null") { }
}