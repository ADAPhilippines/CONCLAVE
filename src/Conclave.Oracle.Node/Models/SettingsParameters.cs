namespace Conclave.Oracle.Node.Models;

public record SettingsParameters
{
    public string PrivateKey { get; init; } = string.Empty;
    public string ContractAddress { get; init; } = string.Empty;
    public string BlockFrostNetwork { get; init; } = string.Empty;
    public string BlockFrostAPIKey { get; init; } = string.Empty;
    public string EthereumRPC { get; init; } = string.Empty;
}
