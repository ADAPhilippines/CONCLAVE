using Conclave.Oracle.Node.Services;
using Conclave.Oracle.Node.Models;
using Conclave.Oracle.Node.Utils;
using System.Numerics;
using Microsoft.Extensions.Options;
using Conclave.Oracle.Node.Contracts.Definition;
using Conclave.Oracle.Node.Helpers;

namespace Conclave.Oracle;

public class OracleWorker : BackgroundService
{
    private const int RETRY_DURATION = 4000;
    #region private variables
    private readonly ILogger<OracleWorker> _logger;
    private readonly OracleContractService _oracleContractService;
    private readonly CardanoServices _cardanoService;
    private readonly EthAccountServices _ethAccountServices;
    private readonly IOptions<SettingsParameters> _options;
    private readonly IHostApplicationLifetime _hostApplicationLifetime;
    private readonly IHostEnvironment _environment;
    private readonly IConfiguration _configuration;
    #endregion
    public OracleWorker(
        ILogger<OracleWorker> logger,
        OracleContractService oracleContractService,
        CardanoServices cardanoService,
        EthAccountServices ethAccountServices,
        IOptions<SettingsParameters> options,
        IHostEnvironment environment,
        IConfiguration configuration,
        IHostApplicationLifetime hostApplicationLifetime)
        : base()
    {
        _configuration = configuration;
        _cardanoService = cardanoService;
        _logger = logger;
        _oracleContractService = oracleContractService;
        _ethAccountServices = ethAccountServices;
        _options = options;
        _hostApplicationLifetime = hostApplicationLifetime;
        _environment = environment;
    }

    protected override async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        #region logs
        if (_environment.IsDevelopment())
            _logger.LogInformation("Account : {0}\nContract Address : {1}", _configuration.GetValue<string>("PrivateKey"), _options.Value.ContractAddress);
        #endregion

        await VerifyPrivateKeyDelegationAsync();

        _ = Task.Run(async () => await GetPendingRequestsAsync());

        _ = Task.Run(async () => await ListenToRequestAsync());
    }

    public async Task GetPendingRequestsAsync()
    {
        #region delegation checker
        await DelegationCheckerAsync();
        #endregion
        #region logs
        _logger.LogInformation("Starting pending requests handler.");
        #endregion

        List<PendingRequestOutputDTO>? pendingRequests = await _oracleContractService.GetPendingRequestsAsync();
        if (pendingRequests?.Count is 0)
            _logger.LogInformation("No pending requests found.");
        else
            PendingRequestHandler(pendingRequests);
    }

    public async Task ListenToRequestAsync()
    {
        #region delegation checker
        await DelegationCheckerAsync();
        #endregion
        #region logs
        _logger.LogInformation("Starting contract event listener.");
        #endregion

        await _oracleContractService.ListenToRequestNumberEventWithCallbackAsync(GenerateAndSubmitDecimalsAsync);
    }

    public async Task GenerateAndSubmitDecimalsAsync(BigInteger requestId, BigInteger unixTimeS, BigInteger numberOfdecimals)
    {
        #region delegation checker
        await DelegationCheckerAsync();
        #endregion

        List<BigInteger> decimalsList = await GenerateDecimalsAsync(requestId, unixTimeS, numberOfdecimals);

        #region logs
        string listLog = string.Empty;
        decimalsList.ForEach((b) =>
        {
            int i = decimalsList.IndexOf(b);
            if (b == decimalsList.Last())
                listLog += string.Format("[{0}] {1}", i, b);
            else
                listLog += string.Format("[{0}] {1}\n", i, b);
        });

        _logger.BeginScope("Processing request Id# : {0}", requestId);
        using (_logger.BeginScope("Decimals"))
            _logger.LogInformation(listLog);
        #endregion

        await SubmitDecimalsAsync(requestId, decimalsList);
    }

    #region helpers
    public async Task VerifyPrivateKeyDelegationAsync()
    {
        #region logs
        _logger.LogInformation("Checking current account {0} is delegated", _ethAccountServices.Address);
        #endregion

        bool IsDelegated = await _oracleContractService.IsDelegatedAsync();

        while (IsDelegated is false)
            IsDelegated = await DelegationFalseHandlerAsync(IsDelegated);
    }

    public async Task SubmitDecimalsAsync(BigInteger requestId, List<BigInteger> decimalsList)
    {
        #region delegation checker
        await DelegationCheckerAsync();
        #endregion

        await _oracleContractService.SubmitResultAsync(requestId, decimalsList);

        #region logs        
        LoggingHelper.LogWithScope<OracleWorker>(_logger, "Submitting request Id# : {0}", "Submitted", requestId);
        #endregion
    }

    public async Task<List<BigInteger>> GenerateDecimalsAsync(BigInteger requestId, BigInteger unixTimeS, BigInteger numberOfdecimals)
    {
        string firstBlockHash = await _cardanoService.GetNearestBlockHashFromTimeSAsync((int)unixTimeS, requestId);
        List<string> blockHashesList = await _cardanoService.GetNextBlocksFromCurrentHashAsync(firstBlockHash, (int)(numberOfdecimals - 1), requestId);
        return blockHashesList.Select((dec) => StringUtils.HexStringToBigInteger(dec)).ToList();
    }

    public async Task DelegationCheckerAsync()
    {
        if ((await _oracleContractService.IsDelegatedAsync()) is false)
        {
            _logger.LogError("Account no longer delegated.");
            Environment.Exit(0);
        }
    }

    public void PendingRequestHandler(List<PendingRequestOutputDTO>? pendingRequests)
    {
        pendingRequests?.ForEach(async (request) =>
        {
            using (_logger.BeginScope("PENDING: Request Id# {0}", request.RequestId))
                _logger.LogInformation("TimeStamp: {0}\nNumbers: {1}", request.TimeStamp, request.NumberOfDecimals);
            await GenerateAndSubmitDecimalsAsync(request.RequestId, request.TimeStamp, request.NumberOfDecimals);
        });
    }

    public async Task<bool> DelegationFalseHandlerAsync(bool isDelegated)
    {
        isDelegated = await _oracleContractService.IsDelegatedAsync();
        if (isDelegated)
            _logger.LogInformation($"Account is delegated!");
        else
        {
            _logger.LogWarning("Account is not delegated. Please delegate to address {0}\nDelegation may take a few seconds to confirm...", _ethAccountServices.Address);
            await Task.Delay(RETRY_DURATION);
        }
        return isDelegated;
    }
    #endregion
}