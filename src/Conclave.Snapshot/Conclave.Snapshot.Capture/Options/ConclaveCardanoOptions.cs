using Microsoft.Extensions.Options;

namespace Conclave.Snapshot.Capture.Options;


public class ConclaveCardanoOptions
{
    public List<string> PoolIds { get; set; } = new();
}