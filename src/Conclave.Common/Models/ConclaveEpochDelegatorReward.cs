using Conclave.Common.Utils;

namespace Conclave.Common.Models;


public class ConclaveEpochDelegatorReward
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ConclaveEpochDelegator ConclaveEpochDelegator { get; set; }
    public ConclaveEpochReward ConclaveEpochReward { get; set; }
    public float PercentageShare { get; set; }
    public DateTime DateCreated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
    public DateTime DateUpdated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
}