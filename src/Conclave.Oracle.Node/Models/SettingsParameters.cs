namespace Conclave.Oracle.Node.Models;

public record SettingsParameters
{
    public string ContractAddress { get; init; } = string.Empty;
    // TODO: change to cardano network
    public string CardanoNetwork { get; init; } = string.Empty;
    public string EthereumRPC { get; init; } = string.Empty;
    public string ADARewardThreshold { get; init; } = string.Empty;
    public string CNCLVRewardThreshold { get; init; } = string.Empty;
    public string MinimumJobReward { get; init; } = string.Empty;
}
