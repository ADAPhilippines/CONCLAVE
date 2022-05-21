using Conclave.Common.Enums;
using Conclave.Common.Utils;

namespace Conclave.Common.Models;

public class ConclaveEpoch
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ulong EpochNumber { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public EpochStatus EpochStatus { get; set; } = EpochStatus.New;
    public SnapshotStatus SnapshotStatus { get; set; } = SnapshotStatus.New;
    public RewardStatus RewardStatus { get; set; } = RewardStatus.New;
    public AirdropStatus AirdropStatus { get; set; } = AirdropStatus.New;
    public DateTime DateCreated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
    public DateTime DateUpdated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
}