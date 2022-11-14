using Conclave.Oracle.Node.Models;
using Microsoft.Extensions.Options;
using Conclave.Oracle.Node.Services.Bases;
using System.Numerics;
using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts;

namespace Conclave.Oracle.Node.Services;

public class OracleContractService : ContractServiceBase
{
    [Event("RequestCreated")]
    class RequestNumberEvent
    {
        [Parameter("uint256", "requestId", 1, true)]
        public BigInteger RequestId { get; set; }

        [Parameter("uint256", "timestamp", 2, true)]
        public BigInteger TimeStamp { get; set; }

        [Parameter("uint256", "numberOfdecimals", 3, true)]
        public BigInteger NumberOfDecimals { get; set; }
    }
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

    public async Task<List<BigInteger>?> GetPendingRequestsAsync()
    {
        return await _ethereumWalletServices.CallContractReadFunctionNoParamsAsync<List<BigInteger>>(ContractAddress, ABI, "getPendingRequests");
    }

    public async Task SubmitResultAsync(BigInteger requestId, List<BigInteger> decimals)
    {
        await _ethereumWalletServices.CallContractWriteFunctionAsync(ContractAddress, _ethereumWalletServices.Address!, ABI, "submitResult", 0, requestId, decimals);
    }

    public async Task ListenToRequestNumberEventAsync(Func<BigInteger, BigInteger, BigInteger, Task> generateDecimalFunction)
    {
        await _ethereumWalletServices.ListenContractEventAsync<RequestNumberEvent>(ContractAddress, ABI, "RequestCreated", (logs) =>
        {
            foreach (EventLog<RequestNumberEvent> log in logs)
            {
                Console.ForegroundColor = ConsoleColor.DarkYellow;
                Console.WriteLine("Received Event RequestId: {0} ...", log.Event.RequestId);
                _ = Task.Run(async () =>
                {
                    await generateDecimalFunction(log.Event.RequestId, log.Event.TimeStamp, log.Event.NumberOfDecimals);
                });
                // Console.WriteLine(decimalsList[0]);
                Console.ForegroundColor = ConsoleColor.White;
            }
            return true;
        });
    }
}