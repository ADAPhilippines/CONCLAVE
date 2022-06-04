using Conclave.Common.Enums;
using Conclave.Common.Utils;

namespace Conclave.Common.Models;


public class ConclaveHolderReward
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ConclaveEpoch? ConclaveEpoch { get; set; }
    public ulong RewardAmount { get; set; }
    public AirdropStatus AirdropStatus { get; set; } = AirdropStatus.InProgress;
    public DateTime DateCreated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
    public DateTime DateUpdated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
}