using Conclave.Common.Enums;
using Conclave.Common.Utils;

namespace Conclave.Common.Models;


public class ConclaveEpochPoolOwnerReward
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int EpochNumber { get; set; }
    public ulong RewardAmount { get; set; }
    public string PoolId { get; set; } = string.Empty;
    public DateTime DateCreated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
    public DateTime DateUpdated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
}