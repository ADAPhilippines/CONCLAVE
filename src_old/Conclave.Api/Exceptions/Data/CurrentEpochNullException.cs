namespace Conclave.Api.Exceptions.Data;

public class CurrentEpochNullException : Exception
{
    public CurrentEpochNullException() : base("CurrentEpoch is null") { }
}