using Conclave.Common.Enums;
using Conclave.Common.Utils;

namespace Conclave.Common.Models;

public class ConclaveSnapshot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ConclaveEpoch? ConclaveEpoch { get; set; }
    public string? StakingId { get; set; }
    public string? PoolId { get; set; }
    public ulong DelegatedAmount { get; set; }
    public DateTime DateCreated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
}