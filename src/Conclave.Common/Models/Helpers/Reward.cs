using Conclave.Common.Enums;

namespace Conclave.Common.Models;

public class Reward
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public RewardType RewardType { get; set; }
    public double RewardAmount { get; set; }
    public string WalletAddress { get; set; } = string.Empty;
    public string StakeAddress { get; set; } = string.Empty;

    public Reward(Guid Id, RewardType RewardType, double RewardAmount, string WalletAddress, string StakeAddress)
    {
        this.Id = Id;
        this.RewardType = RewardType;
        this.RewardAmount = RewardAmount;
        this.WalletAddress = WalletAddress;
        this.StakeAddress = StakeAddress;
    }
}