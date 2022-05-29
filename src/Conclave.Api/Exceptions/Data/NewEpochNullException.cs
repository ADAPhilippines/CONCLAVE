namespace Conclave.Api.Exceptions.Data;

public class NewEpochNullException : Exception
{
    public NewEpochNullException() : base("NewEpoch is null") { }
}