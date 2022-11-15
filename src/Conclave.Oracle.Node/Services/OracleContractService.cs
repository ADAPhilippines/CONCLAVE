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

    public OracleContractService(
        ILogger<OracleContractService> logger,
        IOptions<SettingsParameters> settings,
        EthereumWalletServices ethereumWalletServices,
        CardanoServices cardanoService) : base(
                                                settings.Value.ContractAddress,
                                                settings.Value.PrivateKey,
                                                settings.Value.EthereumRPC,
                                                settings.Value.ContractABI)
    {
        _cardanoService = cardanoService;
        _logger = logger;
        _ethereumWalletServices = ethereumWalletServices;
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

    public async Task ListenToRequestNumberEventWithCallbackAsync(Func<BigInteger, BigInteger, BigInteger, Task> generateDecimalFunction)
    {
        await _ethereumWalletServices.ListenContractEventAsync<RequestCreatedEventDTO>(ContractAddress, ABI, "RequestCreated", (logs) =>
        {
            foreach (EventLog<RequestCreatedEventDTO> log in logs)
            {
                Console.ForegroundColor = ConsoleColor.DarkYellow;
                _ = Task.Run(async () =>
                {
                    Console.WriteLine();
                    Console.ForegroundColor = ConsoleColor.DarkYellow;
                    Console.WriteLine("--------- RECEIVED Request Id #: {0} (Details)---------", log.Event.RequestId);
                    Console.WriteLine("RequestId : {0}", log.Event.RequestId);
                    Console.WriteLine("TimeStamp in seconds : {0}", log.Event.TimeStamp);
                    Console.WriteLine("Number of Decimals : {0}", log.Event.NumberOfDecimals);
                    Console.ForegroundColor = ConsoleColor.White;
                    await generateDecimalFunction(log.Event.RequestId, log.Event.TimeStamp, log.Event.NumberOfDecimals);
                });
            }
            return true;
        });
    }
}