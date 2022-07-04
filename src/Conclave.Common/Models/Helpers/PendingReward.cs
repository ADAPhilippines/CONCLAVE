namespace Conclave.Common.Models;

public class PendingReward
{
    public string StakingAddress { get; set; } = string.Empty;
    public double Amount { get; set; }
    public ConclaveOwnerSnapshot ConclaveOwnerSnapshot { get; set; } = new();
    public PendingReward(string stakingAddress, double amount, ConclaveOwnerSnapshot conclaveOwnerSnapshot)
    {
        StakingAddress = stakingAddress;
        Amount = amount;
        ConclaveOwnerSnapshot = conclaveOwnerSnapshot;
    }
}