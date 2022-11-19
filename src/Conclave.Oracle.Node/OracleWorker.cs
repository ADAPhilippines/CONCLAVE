using Conclave.Oracle.Node.Services;
using Conclave.Oracle.Node.Models;
using Conclave.Oracle.Node.Utils;
using System.Numerics;
using Microsoft.Extensions.Options;
using Conclave.Oracle.Node.Helpers;
using Conclave.Oracle.Node.Contracts.Definition.FunctionOutputs;

namespace Conclave.Oracle;

public class OracleWorker : BackgroundService
{
    private static bool s_IsDelegated = true;
    private const int RETRY_DURATION = 4000;
    private const int CHECK_REWARDS_DURATION = 30000;
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

        // await VerifyAccountDelegationAsync();

        if (s_IsDelegated)
            ProcessTasks();
        else
            await AwaitDelegationAsync();
    }

    public void ProcessTasks()
    {
        _ = Task.Run(async () => await CheckRewardsForClaimingAsync());

        _ = Task.Run(async () => await GetPendingRequestsAsync());

        _ = Task.Run(async () => await ListenToRequestsAsync());
    }

    public async Task GetPendingRequestsAsync()
    {
        #region delegation checker
        // await DelegationCheckerAsync();
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

    public async Task ListenToRequestsAsync()
    {
        #region delegation checker
        // await DelegationCheckerAsync();
        #endregion
        #region logs
        _logger.LogInformation("Starting contract event listener.");
        #endregion

        await _oracleContractService.ListenToRequestNumberEventWithCallbackAsync(GenerateDecimalsAsync);
    }

    public async Task CheckRewardsForClaimingAsync()
    {
        while (true)
            await ClaimRewardsIfThresholdMetAsync();
    }

    public async Task VerifyAccountDelegationAsync()
    {
        #region logs
        _logger.LogInformation("Checking current account {0} is delegated", _ethAccountServices.Address);
        #endregion

        //no function from the contract yet
        s_IsDelegated = await _oracleContractService.IsDelegatedAsync();
    }

    #region helpers

    public async Task SubmitDecimalsAsync(BigInteger requestId, List<BigInteger> decimalsList)
    {
        #region delegation checker
        // await DelegationCheckerAsync();
        #endregion

        await _oracleContractService.SubmitResponseAsync(requestId, decimalsList);

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
        //filter pendingRequests
        //sort pendingRequests
        pendingRequests?.ForEach(async (request) =>
        {
            using (_logger.BeginScope("PENDING: Request Id# {0}", request.RequestId))
                _logger.LogInformation("TimeStamp: {0}\nNumbers: {1}", request.TimeStamp, request.NumberOfDecimals);

            List<BigInteger> decimalsList = await GenerateDecimalsAsync(request.RequestId, request.TimeStamp, request.NumberOfDecimals);
            await _oracleContractService.SubmitResponseAsync(request.RequestId, decimalsList);
        });
    }

    public void UpdateDelegation(bool delegation)
    {
        s_IsDelegated = delegation;
    }

    public async Task AwaitDelegationAsync()
    {
        _logger.LogWarning("Account is not delegated. Please delegate to address {0}\nDelegation may take a few seconds to confirm...", _ethAccountServices.Address);

        await _oracleContractService.ListenToNodeRegisteredEventWithCallbackAsync(ProcessTasks, UpdateDelegation);
    }

    public async Task ClaimRewardsIfThresholdMetAsync()
    {
        GetTotalRewardsOutputDTO rewards = await _oracleContractService.GetTotalRewardsAsync();

        if (
            rewards.ADAReward >= BigInteger.Parse(_options.Value.ADARewardThreshold) ||
            rewards.CNCLVReward >= BigInteger.Parse(_options.Value.CNCLVRewardThreshold))
            await _oracleContractService.ClaimPendingRewardsAsync();

        await Task.Delay(CHECK_REWARDS_DURATION);
    }
    #endregion
}