using Conclave.Common.Enums;

namespace Conclave.Common.Models;

public class ConclaveSnapshot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ConclaveEpoch? ConclaveEpoch { get; set; }
    public string? StakingId { get; set; }
    public long DelegatedAmount { get; set; }
    public SnapshotPeriod SnapshotPeriod { get; set; }
    public DateTime DateCreated { get; set; }
}