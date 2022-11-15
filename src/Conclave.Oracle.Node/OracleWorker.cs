using Conclave.Oracle.Node.Services;
using Conclave.Oracle.Node.Models;
using Conclave.Oracle.Node.Constants;
using Conclave.Oracle.Node.Utils;
using System.Numerics;

namespace Conclave.Oracle;

public class OracleWorker : BackgroundService
{
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
        DateTimeOffset dto = new DateTimeOffset(DateTime.UtcNow);
        string unixTimeMs = dto.ToUnixTimeMilliseconds().ToString();

        _logger.LogInformation(unixTimeMs);
        //Error Handling
        await CheckPrivateKeyDelegationAsync();
        _ = Task.Run(async () =>
        {
            await GetPendingRequestsAsync();
        });

        _ = Task.Run(async () =>
        {
            await ListenToRequestAsync();
        });
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
        _logger.LogInformation("Number of Pending requests: {0}", pendingRequests?.Count ?? 0);
        // run process for generating number from blockhash for pending       
    }

    public async Task ListenToRequestAsync()
    {
        _logger.LogInformation("Listening to contract events...");
        await _oracleContractService.ListenToRequestNumberEventAsync(GenerateAndSubmitDecimalsAsync);
        _logger.LogInformation("Currently Listening to Requests...");
    }

    public async Task GenerateAndSubmitDecimalsAsync(BigInteger requestId, BigInteger unixTimeMs, BigInteger numberOfdecimals)
    {
        int slot = NetworkUtils.Preview.UnixTimeMsToSlot(unixTimeMs);
        string firstBlockHash = await _cardanoService.GetNearestBlockHashFromSlot(slot);
        List<string> blockHashesList = await _cardanoService.GetNextBlocksFromCurrentHash(firstBlockHash, numberOfdecimals);
        List<BigInteger> decimalsList = blockHashesList.Select((dec) => StringUtils.HexStringToBigInteger(dec)).ToList();
        await SubmitDecimals(requestId, decimalsList);
    }

    public async Task SubmitDecimals(BigInteger requestId, List<BigInteger> decimalsList)
    {
        Console.ForegroundColor = ConsoleColor.DarkYellow;
        Console.WriteLine("Submitting requestId {0}...", requestId);
        Console.ForegroundColor = ConsoleColor.White;
        await _oracleContractService.SubmitResultAsync(requestId, decimalsList);
        Console.ForegroundColor = ConsoleColor.DarkGreen;
        Console.WriteLine("RequestId {0} Submitted!", requestId);
        Console.ForegroundColor = ConsoleColor.White;
    }
}