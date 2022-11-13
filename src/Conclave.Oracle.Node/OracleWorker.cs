using Conclave.Oracle.Node.Services;
using Conclave.Oracle.Node.Models;
using Conclave.Oracle.Node.Constants;
using Conclave.Oracle.Node.Utils;

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

        _oracleContractService.RequestCreatedEvent += async (sender, e) =>
        {
            await _oracleContractService.WaitBrowserReadyAsync();
            //create utils for hex conversion
            _logger.LogInformation($"Received request Id# {e.RequestId}");
            int slot = NetworkConstants.Preview.UnixTimeMsToSlot(e.Timestamp);
            //get nearest slot

            string blockhash = await _cardanoService.GetNearestBlockHashFromSlot(slot);
            //get next blocks;
            List<string> blockhashes = await _cardanoService.GetNextBlocksFromCurrentHash(blockhash, e.NumberOfdecimals - 1);
            //create utils for this
            List<string> decimalStrings = blockhashes.Select(r => StringUtils.HexToDecimalString(r)).ToList();

            // await SubmitResult(e.RequestId, decimalStrings);
            _logger.LogInformation($"Submitted {decimalStrings.Count} value/s to request Id# {e.RequestId}");
        };
    }

    protected override async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        await _ethereumWalletServices.WaitBrowserReadyAsync();
        nonce = await _ethereumWalletServices.GetTransactionCount();
        string? balance = await _ethereumWalletServices.GetBalance();
        _logger.LogInformation($"nonce is {nonce.ToString()}");
        _logger.LogInformation($"balance is {balance}");
        //create script for ubuntu for this
        DateTimeOffset dto = new DateTimeOffset(DateTime.UtcNow);
        string unixTimeMs = dto.ToUnixTimeMilliseconds().ToString();

        _logger.LogInformation(unixTimeMs);
        _ = Task.Run(async () =>
        {
            _logger.LogInformation("Starting Oracle Node...");
            await _oracleContractService.WaitBrowserReadyAsync();

            await _oracleContractService.ExposeRequestTrigger("requestnumbers", _oracleContractService.RequestNumbers);
            _logger.LogInformation("Oracle Node Started...");
            await CheckPrivateKeyDelegationAsync();
        });
    }

    public async Task CheckPrivateKeyDelegationAsync()
    {
        _logger.LogInformation("Checking address from PrivateKey is Delegated...");
        //Todo: Error Handling;
        bool isDelegated = await _oracleContractService.IsDelegatedAsync();

        if (isDelegated) _logger.LogInformation($"The Private Key Is Delegated!");
        else _logger.LogInformation($"The Private Key Is not Delegated. Please delegate");

        _ = Task.Run(async () =>
        {
            await GetPendingRequestsAsync();
        });

        _ = Task.Run(async () =>
        {
            await ListenToRequestAsync();
        });
    }

    public async Task GetPendingRequestsAsync()
    {
        _logger.LogInformation("Checking for pending Requests...");
        //Todo: Error Handling;
        List<JSBigNumber>? pendingRequests = await _oracleContractService.GetPendingRequestsAsync();
        _logger.LogInformation($"Number of Pending requests: {pendingRequests?.Count ?? 0}");
        // run process for generating number from blockhash for pending       
    }

    public async Task ListenToRequestAsync()
    {
        _logger.LogInformation("Listening to contract events...");
        await _oracleContractService.ListenToRequestCreatedEventAsync();
        _logger.LogInformation("Currently Listening to Requests...");
    }

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