using Conclave.Common.Utils;

namespace Conclave.Common.Models;


public class OperatorSnapshot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DelegatorSnapshot DelegatorSnapshot { get; set; } = new();
    public ConclaveEpoch ConclaveEpoch { get; set; } = new();
    public string PoolAddress { get; set; } = string.Empty;
    public string StakeAddress { get; set; } = string.Empty;
    public string WalletAddress { get; set; } = string.Empty;
    public ulong Pledge { get; set; }
    public DateTime DateCreated { get; set; } = DateUtils.AddOffsetToUtc(DateTime.UtcNow);
    public DateTime DateUpdated { get; set; } = DateUtils.AddOffsetToUtc(DateTime.UtcNow);
}