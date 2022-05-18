using Conclave.Snapshot.Server.Enums;
using Conclave.Snapshot.Server.Utils;

namespace Conclave.Snapshot.Server.Models;

public class ConclaveEpoch
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public long EpochNumber { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public EpochStatus EpochStatus { get; set; }
    public SnapshotStatus SnapshotStatus { get; set; }
    public RewardStatus RewardStatus { get; set; }
    public AirdropStatus AirdropStatus { get; set; }
    public DateTime DateCreated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
    public DateTime DateUpdated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
}