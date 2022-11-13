using Conclave.Oracle.Node.Models;
using Conclave.Oracle.Node.Services.Bases;
using Microsoft.Extensions.Options;
using Conclave.Oracle.Node.Services.Interfaces;

namespace Conclave.Oracle.Node.Services;

public class EthereumWalletServices : WalletServiceBase, IBrowserService
{
    private readonly BrowserService _browserService;

    public EthereumWalletServices(
        IOptions<SettingsParameters> settings,
        BrowserService browserService) : base(settings.Value.PrivateKey, settings.Value.EthereumRPC)
    {
        _browserService = browserService;
    }

    public async Task<int> GetTransactionCount()
    {
        return await _browserService.InvokeFunctionAsync<int>("GetTransactionCount", PrivateKey, RPC);
    }

    public async Task<string?> GetBalance()
    {
        return await _browserService.InvokeFunctionAsync<string>("GetBalance", PrivateKey, RPC);
    }

    public async Task WaitBrowserReadyAsync()
    {
        await _browserService.WaitBrowserReadyAsync();
    }
}