using Conclave.Common.Utils;

namespace Conclave.Common.Models;


public class ConclaveEpochDelegatorReward
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ConclaveEpochDelegator ConclaveEpochDelegator { get; set; }
    public ConclaveEpochReward ConclaveEpochReward { get; set; }
    public double PercentageShare { get; set; }
    public double TokenShare { get; set; }
    public DateTime DateCreated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
    public DateTime DateUpdated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
}