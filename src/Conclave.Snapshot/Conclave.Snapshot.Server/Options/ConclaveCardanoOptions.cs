using Microsoft.Extensions.Options;

namespace Conclave.Snapshot.Server.Options;


public class ConclaveCardanoOptions
{
    public List<string> PoolIds { get; set; } = new();
}