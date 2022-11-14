using Conclave.Oracle.Node.Services;
using Conclave.Oracle.Node.Models;
using Conclave.Oracle.Node.Constants;
using Conclave.Oracle.Node.Utils;
using Nethereum.Hex.HexTypes;
using System.Numerics;

namespace Conclave.Oracle;

public class OracleWorker : BackgroundService
{
    private static int nonce;
    private readonly ILogger<OracleWorker> _logger;
    private readonly OracleContractService _oracleContractService;
    private readonly CardanoServices _cardanoService;
    private readonly EthereumWalletServices _ethereumWalletServices;
    public OracleWorker(
        ILogger<OracleWorker> logger,
        OracleContractService oracleContractService,
        CardanoServices cardanoService,
        EthereumWalletServices ethereumWalletServices
        ) : base()
    {
        _cardanoService = cardanoService;
        _logger = logger;
        _oracleContractService = oracleContractService;
        _ethereumWalletServices = ethereumWalletServices;
    }

    protected override async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        //create script for ubuntu for this
        // DateTimeOffset dto = new DateTimeOffset(DateTime.UtcNow);
        // string unixTimeMs = dto.ToUnixTimeMilliseconds().ToString();
        // HexBigInteger res = await _ethereumWalletServices.GetBalance();
        // _logger.LogInformation("Current Balance is {0}:", res.ToString());
        await CheckPrivateKeyDelegationAsync();
        _ = Task.Run(async () => {
            await GetPendingRequestsAsync();
        });

        // _ = Task.Run(async () => {

        // });
    }

    public async Task CheckPrivateKeyDelegationAsync()
    {
        _logger.LogInformation("Checking address from PrivateKey is Delegated...");
        //Todo: Error Handling;
        bool isDelegated = await _oracleContractService.IsDelegatedAsync();

        if (isDelegated) _logger.LogInformation($"The Private Key Is Delegated!");
        else _logger.LogInformation($"The Private Key Is not Delegated. Please delegate");
    }

    public async Task GetPendingRequestsAsync()
    {
        _logger.LogInformation("Checking for pending Requests...");
        //Todo: Error Handling;
        List<BigInteger>? pendingRequests = await _oracleContractService.GetPendingRequestsAsync();
        _logger.LogInformation($"Number of Pending requests: {pendingRequests?.Count ?? 0}");
        // run process for generating number from blockhash for pending       
    }

    // public async Task ListenToRequestAsync()
    // {
    //     _logger.LogInformation("Listening to contract events...");
    //     await _oracleContractService.ListenToRequestCreatedEventAsync();
    //     _logger.LogInformation("Currently Listening to Requests...");
    // }

    // public async Task SubmitResult(string requestId, List<string> decimalStrings)
    // {
    //     int trial = 0;
    //     const int maxTrial = 10;

    //     while (trial < maxTrial)
    //     {
    //         try
    //         {
    //             await _oracleContractService.SubmitResultAsync(requestId, decimalStrings);
    //         }
    //         catch (Exception e)
    //         {
    //             _logger.LogCritical("Error submitting transaction... retrying in 5s");
    //         }
    //         if (trial is maxTrial) break;
    //         trial++;
    //     }
    // }
}