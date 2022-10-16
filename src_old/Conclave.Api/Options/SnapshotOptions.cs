namespace Conclave.Api.Options;

public class SnapshotOptions
{
    public long SnapshotBeforeMilliseconds { get; set; }
    public long SnapshotCompleteAfterMilliseconds { get; set; }
}