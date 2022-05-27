using Conclave.Common.Enums;

namespace Conclave.Common.Models;

public class ConclaveSnapshot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ConclaveEpoch? ConclaveEpoch { get; set; }
    public string StakingId { get; set; } = string.Empty;
    public string PoolId { get; set; } = string.Empty;
    public ulong DelegatedAmount { get; set; }
    public DateTime DateCreated { get; set; }
}