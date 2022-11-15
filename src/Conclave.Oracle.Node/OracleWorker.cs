using Conclave.Oracle.Node.Services;
using Conclave.Oracle.Node.Models;
using Conclave.Oracle.Node.Utils;
using System.Numerics;
using Conclave.Oracle.Node.Exceptions;
using Microsoft.Extensions.Options;
using Conclave.Oracle.Node.Contracts.Definition;

namespace Conclave.Oracle;

public class OracleWorker : BackgroundService
{
    private readonly ILogger<OracleWorker> _logger;
    private readonly OracleContractService _oracleContractService;
    private readonly CardanoServices _cardanoService;
    private readonly EthereumWalletServices _ethereumWalletServices;
    private readonly IOptions<SettingsParameters> _options;

    public OracleWorker(
        ILogger<OracleWorker> logger,
        OracleContractService oracleContractService,
        CardanoServices cardanoService,
        EthereumWalletServices ethereumWalletServices,
        IOptions<SettingsParameters> options
        ) : base()
    {
        _cardanoService = cardanoService;
        _logger = logger;
        _oracleContractService = oracleContractService;
        _ethereumWalletServices = ethereumWalletServices;
        _options = options;
    }

    protected override async Task ExecuteAsync(CancellationToken cancellationToken)
    {
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
        Console.WriteLine();
        Console.WriteLine("---***Starting delegation checker***---");
        Console.WriteLine();
        Console.WriteLine("Private Key : {0}", _options.Value.PrivateKey);
        Console.WriteLine("Contract Address : {0}", _options.Value.ContractAddress);

        bool isDelegated = false;

        Console.WriteLine();
        Console.WriteLine("Checking current address {0} is delegated", _ethereumWalletServices.Address);
        Console.WriteLine();

        while (isDelegated is false)
        {
            isDelegated = await _oracleContractService.IsDelegatedAsync();
            if (isDelegated)
            {
                Console.WriteLine($"Private Key is delegated!");
            }
            else
            {
                Console.WriteLine("Private key is not delegated. Please delegate to your current address {0}", _ethereumWalletServices.Address);
                Console.WriteLine($"Delegation may take a few seconds to confirm...");
                Console.WriteLine();
                Console.WriteLine();
                await Task.Delay(4000);
            }
        }
        Console.WriteLine();
        Console.WriteLine("---***End of delegation checker***---");
    }

    public async Task GetPendingRequestsAsync()
    {
        Console.WriteLine();
        Console.WriteLine();
        Console.WriteLine("---***Starting pending requests handler***---");
        Console.WriteLine();
        //Todo: Error Handling;
        List<PendingRequestOutputDTO>? pendingRequests = await _oracleContractService.GetPendingRequestsAsync();
        if (pendingRequests?.Count is 0)
        {
            Console.WriteLine("No pending requests found. Proceeding to listen to contract event");
            Console.WriteLine();
        }
        else
        {
            pendingRequests?.ForEach(async (request) =>
            {
                Console.WriteLine();
                Console.ForegroundColor = ConsoleColor.DarkYellow;
                Console.WriteLine("--------- PENDING Request Id #: {0} (Details)---------", request.RequestId);
                Console.WriteLine("RequestId : {0}", request.RequestId);
                Console.WriteLine("TimeStamp in seconds : {0}", request.TimeStamp);
                Console.WriteLine("Number of Decimals : {0}", request.NumberOfDecimals);
                Console.ForegroundColor = ConsoleColor.White;
                await GenerateAndSubmitDecimalsAsync(request.RequestId, request.TimeStamp, request.NumberOfDecimals);
            });
        }
    }

    public async Task ListenToRequestAsync()
    {
        Console.WriteLine();
        Console.WriteLine("---***Starting contract event listener***---");
        Console.WriteLine();

        await _oracleContractService.ListenToRequestNumberEventWithCallbackAsync(GenerateAndSubmitDecimalsAsync);
    }

    public async Task GenerateAndSubmitDecimalsAsync(BigInteger requestId, BigInteger unixTimeS, BigInteger numberOfdecimals)
    {
        string firstBlockHash = await _cardanoService.GetNearestBlockHashFromTimeMs((int)unixTimeS, requestId);
        List<string> blockHashesList = await _cardanoService.GetNextBlocksFromCurrentHash(firstBlockHash, (int)(numberOfdecimals - 1), requestId);
        List<BigInteger> decimalsList = blockHashesList.Select((dec) => StringUtils.HexStringToBigInteger(dec)).ToList();

        Console.WriteLine();
        Console.WriteLine("---------Request Id #: {0} (Decimals)---------", requestId);
        int i = 0;
        decimalsList.ForEach((b) =>
        {
            Console.WriteLine("[{0}] {1}", i, b);
            i++;
        });
        await SubmitDecimals(requestId, decimalsList);
    }

    public async Task SubmitDecimals(BigInteger requestId, List<BigInteger> decimalsList)
    {
        Console.WriteLine();
        Console.WriteLine("---------Request Id #: {0} (Submission)---------", requestId);
        Console.WriteLine("Status: Submitting", requestId);
        await _oracleContractService.SubmitResultAsync(requestId, decimalsList);
        Console.ForegroundColor = ConsoleColor.DarkGreen;
        Console.WriteLine();
        Console.WriteLine("---------Request Id #: {0} (Submission)---------", requestId);
        Console.WriteLine("Status: Submitted!", requestId);
        Console.ForegroundColor = ConsoleColor.White;
    }
}