using Conclave.Oracle.Node.Models;
using Conclave.Oracle.Node.Services.Interfaces;
using Microsoft.Extensions.Options;
using Conclave.Oracle.Node.Services.Bases;
using Conclave.Oracle.Node.Constants;
using System.Numerics;
using System.Globalization;

namespace Conclave.Oracle.Node.Services;

public class OracleContractService : ContractServiceBase, IBrowserService
{
    private readonly ILogger<OracleContractService> _logger;
    private readonly BrowserService _browserService;
    private readonly CardanoServices _cardanoService;
    public event EventHandler<RequestModel>? RequestCreatedEvent;

    public OracleContractService(
        ILogger<OracleContractService> logger,
        BrowserService browserService,
        IOptions<SettingsParameters> settings,
        CardanoServices cardanoService) : base(settings.Value.ContractAddress, settings.Value.PrivateKey, settings.Value.EthereumRPC)
    {
        _cardanoService = cardanoService;
        _logger = logger;
        _browserService = browserService;
    }

    public async Task<bool> IsDelegatedAsync()
    {
        return await _browserService.InvokeFunctionAsync<bool>("IsDelegatedAsync", PrivateKey, ContractAddress, RPC);
    }

    public async Task<List<JSBigNumber>?> GetPendingRequestsAsync()
    {
        return await _browserService.InvokeFunctionAsync<List<JSBigNumber>>("GetPendingRequestsAsync", PrivateKey, ContractAddress, RPC);
    }

    public async Task SubmitResultAsync(string requestId, List<string> decimals, int nonce)
    {
        await _browserService.InvokeFunctionAsync("SubmitResultAsync", PrivateKey, ContractAddress, requestId, decimals, nonce, RPC);
    }

    public async Task ListenToRequestCreatedEventAsync()
    {
        await _browserService.InvokeFunctionAsync("ListenToRequestCreatedEventAsync", ContractAddress, RPC);
    }

    public RequestModel RequestNumbers(string requestId, string timeslot, string numberOfDecimals)
    {
        RequestModel req = new(requestId, timeslot, numberOfDecimals);
        RequestCreatedEvent?.Invoke(null, req);
        return req;
    }

    public async Task ExposeRequestTrigger(string functionName, Func<string, string, string, RequestModel> function)
    {
        await _browserService.ExposeFunctionAsync<string, string, string, RequestModel>(functionName, function);
        _logger.LogInformation($"Waiting for function {functionName} to be exposed...");
        await _browserService.WaitFunctionReadyAsync(functionName);
        _logger.LogInformation($"function {functionName} is exposed...");
    }

    public async Task WaitBrowserReadyAsync()
    {
        await _browserService.WaitBrowserReadyAsync();
    }
}