namespace Conclave.Api.Options;

public class RewardOptions
{
    // 73 Epoch for 1 year
    // if 1,000,000,000 total supply
    // reward is 1,3698,630 per epoch
    public double ConclaveTokenAirdropSupply { get; set; }
    public int ConclaveAirdropEpochsCount { get; set; }
    public double OperatorPercentage { get; set; }
    public double DelegatorPercentage { get; set; }
    public double NFTPercentage { get; set; }
    public double ConclaveOwnerRewardSharePercentage { get; set; }
}