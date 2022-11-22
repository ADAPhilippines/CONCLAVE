using Conclave.Oracle.Node.Services;
using Conclave.Oracle.Node.Models;
using System.Numerics;
using Microsoft.Extensions.Options;
using Conclave.Oracle.Node.Contracts.Definition.FunctionOutputs;
using Conclave.Oracle.Node.Contracts.Definition.EventOutputs;

namespace Conclave.Oracle;

public partial class OracleWorker : BackgroundService
{
    #region static variables
    private static bool s_IsRegistered = true;
    #endregion
    #region constant variables
    private const int RETRY_DURATION = 4000;
    private const int CHECK_REWARDS_DURATION = 30000;
    #endregion
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

        if (_environment.IsDevelopment())
            _logger.LogInformation("Starting node in account {0}.", _configuration.GetValue<string>("PrivateKey"));
        else
            _logger.LogInformation("Starting node.", _configuration.GetValue<string>("PrivateKey"));
    }

    protected override async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        s_IsRegistered = await VerifyRegistrationAsync();

        if (s_IsRegistered)
            await StartTasksAsync();
        else
            await AwaitRegistrationAsync();
    }

    public async Task StartTasksAsync()
    {
        _logger.LogInformation("Node is registered. Proceeding with tasks.");
        await DelegationCheckerAsync();

        _ = Task.Run(async () => await ProcessPendingJobRequestsAsync());

        _ = Task.Run(async () => await ListenToJobRequestCreatedEventAsync());

        _ = Task.Run(async () => await ListenToJobRequestFulfilledEventAsync());
    }

    public async Task ProcessPendingJobRequestsAsync()
    {
        _logger.LogInformation("Starting pending requests handler.");

        GetPendingJobIdsOutputDTO pendingRequests = await _oracleContractService.GetPendingJobIdsAsync();

        if (pendingRequests.JobIds.Count is not 0)
            PendingRequestsHandlerAsync(pendingRequests.JobIds);
        else
            _logger.LogInformation("No pending job requests found.");
    }

    public async Task ListenToJobRequestCreatedEventAsync()
    {
        _logger.LogInformation("Listening to request created event.");

        await _oracleContractService.ListenToJobRequestCreatedEventWithCallbackAsync(ProcessJobRequestAsync);
    }

    public async Task ListenToJobRequestFulfilledEventAsync()
    {
        _logger.LogInformation("Listening to request fulfilled event");

        await _oracleContractService.ListenToJobRequestFulfilledEventAsync();
    }
    
    public async void PendingRequestsHandlerAsync(List<BigInteger> jobIdsList)
    {
        List<GetJobDetailsOutputDTO> jobDetailsList = await GetJobDetailsPerIdAsync(jobIdsList);
        _logger.LogInformation(jobDetailsList[0].ToString());

        //filter pendingRequests
        //sort pendingRequests
        jobDetailsList.ForEach(async (jobDetail) => await ProcessJobRequestAsync(jobDetail, "PENDING"));
    }

    public async Task ProcessJobRequestAsync(GetJobDetailsOutputDTO jobDetails, string requestType)
    {
        using (_logger.BeginScope("{0}: Job Id# {1}", requestType, jobDetails.JobId))
            _logger.LogInformation("TimeStamp: {0}\nNumbers: {1}", jobDetails.Timestamp, jobDetails.NumCount);

        await _oracleContractService.AcceptJobAsync(jobDetails.JobId);

        bool isJobReady = await CheckIsJobReadyAfterAcceptanceExpirationAsync(jobDetails);

        if (isJobReady)
            await GenerateAndSubmitDecimalsAsync(jobDetails);
        else
            using (_logger.BeginScope("ACCEPTED: Job Id#: {0}", jobDetails.JobId))
                _logger.LogInformation("Job cancelled.");
    }
}