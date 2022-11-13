using Conclave.Oracle.Node.Models;
using Conclave.Oracle.Node.Services.Interfaces;

namespace Conclave.Oracle.Node.Services.Bases;

public class WalletServiceBase : IWalletService
{
    public string PrivateKey { get; init; }
    public string RPC { get; init; }
    public WalletServiceBase(string privateKey, string rpc)
    {
        PrivateKey = privateKey;
        RPC = rpc;
    }
}