namespace Conclave.Api.Exceptions.Services;

public class CardanoServiceNullException : Exception
{
    public CardanoServiceNullException() : base("CardanoService is null") { }
}