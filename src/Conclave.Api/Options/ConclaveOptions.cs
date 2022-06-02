using Microsoft.Extensions.Options;

namespace Conclave.Api.Options;


public class ConclaveOptions
{
    public List<string> PoolIds { get; set; } = new();
    public string ConclaveAddress { get; set; } = string.Empty;
    public long SnapshotBeforeMilliseconds { get; set; }
    public long SnapshotCompleteAfterMilliseconds { get; set; }
}