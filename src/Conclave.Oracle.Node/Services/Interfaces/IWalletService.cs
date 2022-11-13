using Conclave.Oracle.Node.Models;
using Microsoft.Extensions.Options;

namespace Conclave.Oracle.Node.Services.Interfaces;

public interface IWalletService
{
    public string PrivateKey { get; init; }
    public string RPC { get; init; }
}