namespace Conclave.Common.Models;

public class PendingReward
{
    public string StakingAddress { get; set; } = string.Empty;
    public double Amount { get; set; }
    public PendingReward(string stakingAddress, double amount)
    {
        StakingAddress = stakingAddress;
        Amount = amount;
    }
}