namespace Conclave.Api.Exceptions.Options;

public class ConclaveOptionNullException : Exception
{
    public ConclaveOptionNullException() : base("ConclaveOption is null") { }
}