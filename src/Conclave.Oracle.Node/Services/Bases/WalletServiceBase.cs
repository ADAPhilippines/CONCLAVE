using Conclave.Oracle.Node.Models;
using Conclave.Oracle.Node.Services.Interfaces;

namespace Conclave.Oracle.Node.Services.Bases;

public class WalletServiceBase : IWalletService
{
    public string Address { get; init; } = string.Empty;
    public string PrivateKey { get; init; }
    public string RPC { get; init; }
    public WalletServiceBase(string rpc, IConfiguration configuration)
    {
        PrivateKey = configuration.GetValue<string>("PrivateKey") ?? string.Empty;
        RPC = rpc;
    }
}