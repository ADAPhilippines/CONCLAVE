using Conclave.Oracle.Node.Services.Interfaces;

namespace Conclave.Oracle.Node.Services.Bases;

public class ContractServiceBase : IContract, IWalletService
{
    public string PrivateKey { get; init; } = string.Empty;
    public string ContractAddress { get; init; } = string.Empty;
    public string RPC { get; init; } = string.Empty;
    public string ABI { get; init; } = string.Empty;
    public ContractServiceBase(string contractAddress, string rpc, string abi, IConfiguration configuration)
    {
        ContractAddress = contractAddress;
        PrivateKey = configuration.GetValue<string>("PrivateKey") ?? string.Empty;
        RPC = rpc;
        ABI = abi;
    }
}