namespace Conclave.Api.Options;

public class RewardOptions
{
    // 73 Epoch for 1 year
    // if 1,000,000,000 total supply
    // reward is 1,3698,630 per epoch

    public int MaxConclaveRewardPerEpoch { get; set; }
    public int ConlaveRewardPerEpoch { get; set; }
    public double PoolOwnerRewardPercentagePerEpoch { get; set; }
    public double DelegatorRewardPercentagePerEpoch { get; set; }
    public double NFTStakerRewardPercentagePerEpoch { get; set; }
}