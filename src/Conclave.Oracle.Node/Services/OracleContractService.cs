using Conclave.Oracle.Node.Models;
using Microsoft.Extensions.Options;
using Conclave.Oracle.Node.Services.Bases;
using System.Numerics;
using Nethereum.Contracts;
using Nethereum.RPC.Eth.DTOs;
using Conclave.Oracle.Node.Contracts.Events;

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

    public async Task<List<BigInteger>?> GetPendingRequestsAsync()
    {
        return await _ethereumWalletServices.CallContractReadFunctionNoParamsAsync<List<BigInteger>>(ContractAddress, ABI, "getPendingRequests");
    }

    public async Task SubmitResultAsync(BigInteger requestId, List<BigInteger> decimals)
    {
        await _ethereumWalletServices.CallContractWriteFunctionAsync(ContractAddress, _ethereumWalletServices.Address!, ABI, "submitResult", 0, requestId, decimals);
    }

    public async Task ListenToRequestNumberEventAsync<RequestNumberEvent>()
    {
        await _ethereumWalletServices.ListenContractEventAsync<RequestNumberEvent>(ContractAddress, ABI, "RequestCreated", (logs) =>
        {
            foreach (EventLog<RequestNumberEvent> log in logs)
            {
                Console.ForegroundColor = ConsoleColor.DarkYellow;
                Console.WriteLine("StoreEvent: {0}, BlockNumber: {1}, Tx: {2}");
                Console.ForegroundColor = ConsoleColor.White;
            }
            return true;
        });
    }
}