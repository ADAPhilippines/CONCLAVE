namespace Conclave.Api.Exceptions.Services;

public class ConclaveEpochsServiceNullException : Exception
{
    public ConclaveEpochsServiceNullException() : base("ConclaveEpochsService is null") { }
}