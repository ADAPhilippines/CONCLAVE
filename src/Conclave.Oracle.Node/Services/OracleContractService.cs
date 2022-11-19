using Conclave.Oracle.Node.Models;
using Microsoft.Extensions.Options;
using Conclave.Oracle.Node.Services.Bases;
using System.Numerics;
using Nethereum.Contracts;
using Conclave.Oracle.Node.Contracts.Definition.EventOutputs;
using Conclave.Oracle.Node.Contracts.Definition.FunctionOutputs;

namespace Conclave.Oracle.Node.Services;

public class OracleContractService : ContractServiceBase
{
    private const int CHECK_JOB_IS_READY_DURATION = 3000;
    private readonly ILogger<OracleContractService> _logger;
    private readonly EthAccountServices _ethAccountServices;
    private readonly IOptions<SettingsParameters> _options;
    public OracleContractService(
        ILogger<OracleContractService> logger,
        IOptions<SettingsParameters> options,
        IConfiguration configuration,
        EthAccountServices ethAccountServices,
        CardanoServices cardanoService
        ) : base(
                options.Value.ContractAddress,
                options.Value.EthereumRPC,
                options.Value.ContractABI,
                configuration)
    {
        _options = options;
        _logger = logger;
        _ethAccountServices = ethAccountServices;
    }

    //TODO: replace with RJ's function
    public async Task<bool> IsDelegatedAsync()
    {
        return await _ethAccountServices.CallContractReadFunctionNoParamsAsync<bool>(ContractAddress, ABI, "isDelegated");
    }

    public async Task<List<PendingRequestOutputDTO>?> GetPendingRequestsAsync()
    {
        return await _ethAccountServices.CallContractReadFunctionNoParamsAsync<List<PendingRequestOutputDTO>>(ContractAddress, ABI, "getPendingRequests");
    }

    public async Task SubmitResponseAsync(BigInteger requestId, List<BigInteger> decimals)
    {
        await _ethAccountServices.CallContractWriteFunctionAsync(ContractAddress, _ethAccountServices.Address!, ABI, 0, "submitResponse", requestId, decimals);
    }

    public async Task ListenToRequestNumberEventWithCallbackAsync(Func<BigInteger, BigInteger, BigInteger, Task<List<BigInteger>>> generateDecimalsAsync)
    {
        await _ethAccountServices.ListenContractEventAsync<RequestCreatedEventDTO>(ContractAddress, ABI, "RequestCreated", (logs) =>
        {
            //filter
            // logs = logs.Where(log => log.Event.Reward >= _options.Value.JobRewardThreshold)
            //sort
            // logs = logs.OrderByDescending(log => log.Event.Reward);
            foreach (EventLog<RequestCreatedEventDTO> log in logs)
            {
                //if request reward is greater than jobreward threshold
                _ = Task.Run(async () =>
                {
                    //accept job
                    // await AcceptJobAsync(jobId);
                    using (_logger.BeginScope("ACCEPTED: job Id#: {0}", log.Event.JobId))
                        _logger.LogInformation("TimeStamp: {0}\nNumbers: {1}", log.Event.TimeStamp, log.Event.NumberOfDecimals);
                    //wait for confirmation
                    using (_logger.BeginScope("ACCEPTED: job Id#: {0}", log.Event.JobId))
                        _logger.LogInformation("Awaiting job is ready.", log.Event.TimeStamp, log.Event.NumberOfDecimals);
                    // while ((await IsJobReady(jobId)) is false)
                    //Task.Delay(CHECK_JOB_IS_READY_DURATION);
                    using (_logger.BeginScope("ACCEPTED: job Id#: {0}", log.Event.JobId))
                        _logger.LogInformation("Job is ready.", log.Event.TimeStamp, log.Event.NumberOfDecimals);

                    //if job is ready
                    //get job details
                    //var jobDetails = await GetJobDetailsAsync(jobId);
                    // using (_logger.BeginScope("RECEIVED: request Id#: {0}", log.Event.JobId))
                    //     _logger.LogInformation("TimeStamp: {0}\nNumbers: {1}", log.Event.TimeStamp, log.Event.NumberOfDecimals);
                    List<BigInteger> decimalsList = await generateDecimalsAsync(log.Event.JobId, log.Event.TimeStamp, log.Event.NumberOfDecimals);
                    await SubmitResponseAsync(log.Event.JobId, decimalsList);
                });
            }
            return true;
        });
    }

    public async Task ListenToNodeRegisteredEventWithCallbackAsync(Action processRequests, Action<bool> updateDelegation)
    {
        await _ethAccountServices.ListenContractEventAsync<NodeRegisteredEventDTO>(ContractAddress, ABI, "NodeRegistered", (logs) =>
        {
            foreach (EventLog<NodeRegisteredEventDTO> log in logs)
            {
                _ = Task.Run(() =>
                {
                    if (log.Event.NodeAddress == _ethAccountServices.Address)
                    {
                        _logger.LogInformation("Account is delegated.");
                        updateDelegation(true);
                        processRequests();
                    }
                });
            }
            return true;
        });
    }

    public async Task AcceptJobAsync(BigInteger jobId)
    {
        await _ethAccountServices.CallContractWriteFunctionAsync(ContractAddress, _ethAccountServices.Address!, ABI, 0, "acceptJob", jobId);
    }

    public async Task<GetJobDetailsOutputDTO> GetJobDetailsAsync(BigInteger jobId)
    {
        return await _ethAccountServices.CallContractReadFunctionAsync<GetJobDetailsOutputDTO>(ContractAddress, _ethAccountServices.Address!, ABI, 0, "getJobDetails", jobId);
    }

    public async Task<bool> IsJobReadyAsync(BigInteger jobId)
    {
        return await _ethAccountServices.CallContractReadFunctionAsync<bool>(ContractAddress, ABI, "isJobReady", jobId);
    }

    public async Task<GetTotalRewardsOutputDTO> GetTotalRewardsAsync()
    {
        return await _ethAccountServices.CallContractReadFunctionNoParamsAsync<GetTotalRewardsOutputDTO>(ContractAddress, ABI, "getTotalRewards");
    }

    public async Task<bool> IsResponseSubmittedAsync(BigInteger jobId)
    {
        return await _ethAccountServices.CallContractReadFunctionAsync<bool>(ContractAddress, ABI, "isResponseSubmitted", jobId);
    }

    public async Task ClaimPendingRewardsAsync()
    {
        await _ethAccountServices.CallContractWriteFunctionNoParamsAsync(ContractAddress, _ethAccountServices.Address!, ABI, 0, "claimPendingRewards");
    }
}