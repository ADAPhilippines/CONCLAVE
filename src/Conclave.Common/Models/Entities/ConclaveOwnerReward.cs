using System.Runtime.Serialization;
using Conclave.Common.Utils;

namespace Conclave.Common.Models;

public class ConclaveOwnerReward
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ConclaveOwnerSnapshot DelegatorSnapshot { get; set; } = new();
    public double RewardPercentage { get; set; }
    public double RewardAmount { get; set; }
    public DateTime DateCreated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
    public DateTime DateUpdated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
}