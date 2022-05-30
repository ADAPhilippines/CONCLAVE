namespace Conclave.Common.Models;


public class StakeAddressReward
{
    public ulong EpochNumber { get; set; }
    public ulong RewardAmount { get; set; }
    public string StakeAddress { get; set; } = string.Empty;

    public StakeAddressReward(
        string stakeAddress, 
        ulong rewardAmount, 
        ulong epochNumber)    
    {
        EpochNumber = epochNumber;
        RewardAmount = rewardAmount;
        StakeAddress = stakeAddress;
    }
}