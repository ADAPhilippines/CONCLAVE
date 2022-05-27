using Conclave.Common.Utils;

namespace Conclave.Common.Models;

public class ConclaveEpochReward
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ulong EpochNumber { get; set; }
    public double TotalConclaveReward { get; set; }
    public double SPOSharePercentage { get; set; }
    public double DelegatorSharePercentage { get; set; }
    public double NFTSharePercentage { get; set; }
    public DateTime DateCreated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
    public DateTime DateUpdated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
}