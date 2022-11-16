using Conclave.Oracle.Node.Models;
using Microsoft.Extensions.Options;
using Conclave.Oracle.Node.Services.Bases;
using System.Numerics;
using Nethereum.Contracts;
using Conclave.Oracle.Node.Contracts.Definition;
namespace Conclave.Oracle.Node.Services;

public class OracleContractService : ContractServiceBase
{
    private readonly ILogger<OracleContractService> _logger;
    private readonly CardanoServices _cardanoService;
    private readonly EthereumWalletServices _ethereumWalletServices;
    private readonly IHostApplicationLifetime _hostApplicationLifetime;

    public OracleContractService(
        ILogger<OracleContractService> logger,
        IOptions<SettingsParameters> settings,
        EthereumWalletServices ethereumWalletServices,
        IHostApplicationLifetime hostApplicationLifetime,
        CardanoServices cardanoService
        ) : base(
                settings.Value.ContractAddress,
                settings.Value.PrivateKey,
                settings.Value.EthereumRPC,
                settings.Value.ContractABI)
    {
        _cardanoService = cardanoService;
        _logger = logger;
        _ethereumWalletServices = ethereumWalletServices;
        _hostApplicationLifetime = hostApplicationLifetime;
    }

    public async Task<bool> IsDelegatedAsync()
    {
        return await _ethereumWalletServices.CallContractReadFunctionNoParamsAsync<bool>(ContractAddress, ABI, "isDelegated");
    }

    public async Task<List<PendingRequestOutputDTO>?> GetPendingRequestsAsync()
    {
        return await _ethereumWalletServices.CallContractReadFunctionNoParamsAsync<List<PendingRequestOutputDTO>>(ContractAddress, ABI, "getPendingRequests");
    }

    public async Task SubmitResultAsync(BigInteger requestId, List<BigInteger> decimals)
    {
        await _ethereumWalletServices.CallContractWriteFunctionAsync(ContractAddress, _ethereumWalletServices.Address!, ABI, "submitResult", 0, requestId, decimals);
    }

    public async Task ListenToRequestNumberEventWithCallbackAsync(Func<BigInteger, BigInteger, BigInteger, Task> generateDecimalAndSubmitAsync)
    {
        await _ethereumWalletServices.ListenContractEventAsync<RequestCreatedEventDTO>(ContractAddress, ABI, "RequestCreated", (logs) =>
        {
            foreach (EventLog<RequestCreatedEventDTO> log in logs)
            {
                _ = Task.Run(async () =>
                {
                    #region delegation checker
                    bool isDelegated = await IsDelegatedAsync();
                    if (isDelegated is false)
                    {
                        _logger.LogError("Address no longer delegated.");
                        _hostApplicationLifetime.StopApplication();
                    }
                    #endregion

                    using (_logger.BeginScope("RECEIVED: request Id#: {0}", log.Event.RequestId))
                    {
                        _logger.LogInformation("TimeStamp: {0}\nNumbers: {1}", log.Event.TimeStamp, log.Event.NumberOfDecimals);
                    }
                    await generateDecimalAndSubmitAsync(log.Event.RequestId, log.Event.TimeStamp, log.Event.NumberOfDecimals);
                });
            }
            return true;
        });
    }
}