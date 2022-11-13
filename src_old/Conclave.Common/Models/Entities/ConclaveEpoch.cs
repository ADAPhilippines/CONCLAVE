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
    public SnapshotStatus DelegatorSnapshotStatus { get; set; } = SnapshotStatus.New;
    public SnapshotStatus NFTSnapshotStatus { get; set; } = SnapshotStatus.New;
    public SnapshotStatus OperatorSnapshotStatus { get; set; } = SnapshotStatus.New;
    public SnapshotStatus ConclaveOwnerSnapshotStatus { get; set; } = SnapshotStatus.New;
    public RewardStatus DelegatorRewardStatus { get; set; } = RewardStatus.New;
    public RewardStatus NFTRewardStatus { get; set; } = RewardStatus.New;
    public RewardStatus OperatorRewardStatus { get; set; } = RewardStatus.New;
    public RewardStatus ConclaveOwnerRewardStatus { get; set; } = RewardStatus.New;
    public DateTime DateCreated { get; set; } = DateUtils.AddOffsetToUtc(DateTime.UtcNow);
    public DateTime DateUpdated { get; set; } = DateUtils.AddOffsetToUtc(DateTime.UtcNow);
    public ulong TotalConclaveReward { get; set; }
}