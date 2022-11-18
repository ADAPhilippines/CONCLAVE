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
    private readonly EthAccountServices _ethAccountServices;

    public OracleContractService(
        ILogger<OracleContractService> logger,
        IOptions<SettingsParameters> settings,
        EthAccountServices ethAccountServices,
        CardanoServices cardanoService
        ) : base(
                settings.Value.ContractAddress,
                settings.Value.PrivateKey,
                settings.Value.EthereumRPC,
                settings.Value.ContractABI)
    {
        _logger = logger;
        _ethAccountServices = ethAccountServices;
    }

    public async Task<bool> IsDelegatedAsync()
    {
        return await _ethAccountServices.CallContractReadFunctionNoParamsAsync<bool>(ContractAddress, ABI, "isDelegated");
    }

    public async Task<List<PendingRequestOutputDTO>?> GetPendingRequestsAsync()
    {
        return await _ethAccountServices.CallContractReadFunctionNoParamsAsync<List<PendingRequestOutputDTO>>(ContractAddress, ABI, "getPendingRequests");
    }

    public async Task SubmitResultAsync(BigInteger requestId, List<BigInteger> decimals)
    {
        await _ethAccountServices.CallContractWriteFunctionAsync(ContractAddress, _ethAccountServices.Address!, ABI, "submitResult", 0, requestId, decimals);
    }

    public async Task ListenToRequestNumberEventWithCallbackAsync(Func<BigInteger, BigInteger, BigInteger, Task> generateDecimalAndSubmitAsync)
    {
        await _ethAccountServices.ListenContractEventAsync<RequestCreatedEventDTO>(ContractAddress, ABI, "RequestCreated", (logs) =>
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
                        Environment.Exit(0);
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