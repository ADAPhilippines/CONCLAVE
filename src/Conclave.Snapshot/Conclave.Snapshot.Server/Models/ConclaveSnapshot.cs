using Conclave.Snapshot.Server.Enums;

namespace Conclave.Snapshot.Server.Models;

public class ConclaveSnapshot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ConclaveEpoch? ConclaveEpoch { get; set; }
    public string? StakingId { get; set; }
    public long DelegatedAmount { get; set; }
    public SnapshotPeriod SnapshotPeriod { get; set; }
    public DateTime DateCreated { get; set; }

    public ConclaveSnapshot(ConclaveEpoch conclaveEpoch, string stakingId,
                            long delegatedAmount, SnapshotPeriod snapshotPeriod,
                            DateTime dateCreated)
    {
        ConclaveEpoch = conclaveEpoch;
        StakingId = stakingId;
        DelegatedAmount = delegatedAmount;
        SnapshotPeriod = snapshotPeriod;
        DateCreated = dateCreated;
    }
}