namespace Conclave.Oracle.Node.Models;

public record SettingsParameters
{
    public string ContractAddress { get; init; } = string.Empty;
    public string BlockFrostNetwork { get; init; } = string.Empty;
    public string EthereumRPC { get; init; } = string.Empty;
    public string ContractABI { get; init; } = string.Empty;
}
