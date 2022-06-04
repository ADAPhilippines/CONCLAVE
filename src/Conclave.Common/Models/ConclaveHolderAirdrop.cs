using Conclave.Common.Enums;
using Conclave.Common.Utils;

namespace Conclave.Common.Models;


public class ConclaveHolderAirdrop
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string? WalletAddress { get; set; } = string.Empty;
    public ulong RewardAmount { get; set; }
}