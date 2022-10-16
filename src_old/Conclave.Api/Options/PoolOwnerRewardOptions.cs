using Microsoft.Extensions.Options;

namespace Conclave.Api.Options;


public class PoolOwnerRewardOptions
{
    public long PoolOwnerRewardBeforeMilliseconds { get; set; }
    public long PoolOwnerRewardCompleteAfterMilliseconds { get; set; }
}