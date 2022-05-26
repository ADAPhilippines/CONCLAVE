using Microsoft.Extensions.Options;

namespace Conclave.Api.Options;


public class ConclaveCardanoOptions
{
    public List<string> PoolIds { get; set; } = new();
    public string ConclaveAddress { get; set; } = string.Empty;
}