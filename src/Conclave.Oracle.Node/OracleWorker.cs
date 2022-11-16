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
    private static bool IsDelegated = false;
    private const int RETRY_DURATION = 4000;
    #region private variables
    private readonly ILogger<OracleWorker> _logger;
    private readonly OracleContractService _oracleContractService;
    private readonly CardanoServices _cardanoService;
    private readonly EthereumWalletServices _ethereumWalletServices;
    private readonly IOptions<SettingsParameters> _options;
    private readonly IHostApplicationLifetime _hostApplicationLifetime;
    private readonly IHostEnvironment _environment;
    #endregion
    public OracleWorker(
        ILogger<OracleWorker> logger,
        OracleContractService oracleContractService,
        CardanoServices cardanoService,
        EthereumWalletServices ethereumWalletServices,
        IOptions<SettingsParameters> options,
        IHostEnvironment environment,
        IHostApplicationLifetime hostApplicationLifetime)
        : base()
    {
        _cardanoService = cardanoService;
        _logger = logger;
        _oracleContractService = oracleContractService;
        _ethereumWalletServices = ethereumWalletServices;
        _options = options;
        _hostApplicationLifetime = hostApplicationLifetime;
        _environment = environment;
    }

    protected override async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        #region logs
        if (_environment.IsDevelopment())
            _logger.LogInformation("Private Key : {0}\nContract Address : {1}", _options.Value.PrivateKey, _options.Value.ContractAddress);
        #endregion

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
        #region logs
        _logger.LogInformation("Checking current address {0} is delegated", _ethereumWalletServices.Address);
        #endregion

        while (IsDelegated is false)
        {
            IsDelegated = await _oracleContractService.IsDelegatedAsync();
            if (IsDelegated)
            {
                _logger.LogInformation($"Private key is delegated!");
            }
            else
            {
                _logger.LogWarning("Private key is not delegated. Please delegate to address {0}\nDelegation may take a few seconds to confirm...", _ethereumWalletServices.Address);
                await Task.Delay(RETRY_DURATION);
            }
        }
    }

    public async Task GetPendingRequestsAsync()
    {
        #region delegation checker
        IsDelegated = await _oracleContractService.IsDelegatedAsync();
        if (IsDelegated is false)
        {
            _logger.LogError("Address no longer delegated.");
            _hostApplicationLifetime.StopApplication();
        }
        #endregion
        #region logs
        _logger.LogInformation("Starting pending requests handler.");
        #endregion

        List<PendingRequestOutputDTO>? pendingRequests = await _oracleContractService.GetPendingRequestsAsync();
        if (pendingRequests?.Count is 0)
        {
            _logger.LogInformation("No pending requests found.");
        }
        else
        {
            pendingRequests?.ForEach(async (request) =>
            {
                using (_logger.BeginScope("PENDING: Request Id# {0}", request.RequestId))
                {
                    _logger.LogInformation("TimeStamp: {0}\nNumbers: {1}", request.TimeStamp, request.NumberOfDecimals);
                }
                await GenerateAndSubmitDecimalsAsync(request.RequestId, request.TimeStamp, request.NumberOfDecimals);
            });
        }
    }

    public async Task ListenToRequestAsync()
    {
        #region delegation checker
        IsDelegated = await _oracleContractService.IsDelegatedAsync();
        if (IsDelegated is false)
        {
            _logger.LogError("Address no longer delegated.");
            _hostApplicationLifetime.StopApplication();
        }
        #endregion
        #region logs
        _logger.LogInformation("Starting contract event listener.");
        #endregion

        await _oracleContractService.ListenToRequestNumberEventWithCallbackAsync(GenerateAndSubmitDecimalsAsync);
    }

    public async Task GenerateAndSubmitDecimalsAsync(BigInteger requestId, BigInteger unixTimeS, BigInteger numberOfdecimals)
    {
        #region delegation checker
        IsDelegated = await _oracleContractService.IsDelegatedAsync();
        if (IsDelegated is false)
        {
            _logger.LogError("Address no longer delegated.");
            _hostApplicationLifetime.StopApplication();
        }
        #endregion

        string firstBlockHash = await _cardanoService.GetNearestBlockHashFromTimeMsAsync((int)unixTimeS, requestId);
        List<string> blockHashesList = await _cardanoService.GetNextBlocksFromCurrentHashAsync(firstBlockHash, (int)(numberOfdecimals - 1), requestId);
        List<BigInteger> decimalsList = blockHashesList.Select((dec) => StringUtils.HexStringToBigInteger(dec)).ToList();
        #region logs
        string decimalLogs = string.Empty;
        decimalsList.ForEach((b) =>
        {
            int i = decimalsList.IndexOf(b);
            if (b == decimalsList.Last())
                decimalLogs += string.Format("[{0}] {1}", i, b);
            else
                decimalLogs += string.Format("[{0}] {1}\n", i, b);
        });
        using (_logger.BeginScope("Processing request Id#: {0}", requestId))
        {
            using (_logger.BeginScope("Decimal/s"))
            {
                _logger.LogInformation(decimalLogs);
            }
        };
        #endregion

        await SubmitDecimalsAsync(requestId, decimalsList);
    }

    public async Task SubmitDecimalsAsync(BigInteger requestId, List<BigInteger> decimalsList)
    {
        #region delegation checker
        IsDelegated = await _oracleContractService.IsDelegatedAsync();
        if (IsDelegated is false)
        {
            _logger.LogError("Address no longer delegated.");
            _hostApplicationLifetime.StopApplication();
        }
        #endregion
        #region logs
        _logger.BeginScope("Submitting request Id#: {0}", requestId);
        _logger.LogInformation("Submitting result.");
        #endregion

        await _oracleContractService.SubmitResultAsync(requestId, decimalsList);

        #region logs        
        _logger.LogInformation("Result submitted.");
        #endregion
    }
}