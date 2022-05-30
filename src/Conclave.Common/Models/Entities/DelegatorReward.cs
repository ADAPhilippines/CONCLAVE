using System.Runtime.Serialization;
using Conclave.Common.Enums;
using Conclave.Common.Utils;

namespace Conclave.Common.Models;

public class DelegatorReward
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DelegatorSnapshot DelegatorSnapshot { get; set; } = new();
    public double RewardPercentage { get; set; }
    public double RewardAmount { get; set; }
    public AirdropStatus AirdropStatus { get; set; } = AirdropStatus.New;
    public string TransactionHash { get; set; } = string.Empty;
    public DateTime DateCreated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
    public DateTime DateUpdated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
}