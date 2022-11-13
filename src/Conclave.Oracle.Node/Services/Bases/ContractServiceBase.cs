using Conclave.Oracle.Node.Interfaces;
using Conclave.Oracle.Node.Services.Interfaces;

namespace Conclave.Oracle.Node.Services.Bases;

public class ContractServiceBase : IContract, IWalletService
{
    public string PrivateKey { get; init; } = string.Empty;
    public string ContractAddress { get; init; } = string.Empty;
    public string RPC { get; init; } = string.Empty;
    public ContractServiceBase(string contractAddress, string privateKey, string rpc)
    {
        ContractAddress = contractAddress;
        PrivateKey = privateKey;
        RPC = rpc;
    }
}