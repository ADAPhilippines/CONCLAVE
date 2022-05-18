using Conclave.Snapshot.Server.Enums;

namespace Conclave.Snapshot.Server.Models;

public class ConclaveEpoch
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public long EpochNumber { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public EpochStatus EpochStatus { get; set; }

}