using Conclave.Oracle.Node.Models;
using Microsoft.Extensions.Options;
using Conclave.Oracle.Node.Services.Bases;
using System.Numerics;
using Nethereum.Contracts;
using Conclave.Oracle.Node.Contracts.Definition;

namespace Conclave.Oracle.Node.Services;

public class OracleContractService : ContractServiceBase
{
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
                configuration)
    {
        _options = options;
        _logger = logger;
        _ethAccountServices = ethAccountServices;
        string jsonString = File.ReadAllText("Contracts/Abi/ConclaveOracle.json");
        ABI = jsonString;
    }

    public async Task<bool> IsNodeRegisteredAsync()
    {
        return await _ethAccountServices.CallContractReadFunctionAsync<bool>(ContractAddress, ABI, "isNodeRegistered", _ethAccountServices.Address);
    }

    public async Task<GetPendingJobIdsOutput> GetPendingJobIdsAsync()
    {
        return await _ethAccountServices.CallContractReadFunctionNoParamsAsync<GetPendingJobIdsOutput>(ContractAddress, ABI, "getPendingJobIds");
    }

    public async Task SubmitResponseAsync(BigInteger requestId, List<BigInteger> decimals)
    {
        await _ethAccountServices.CallContractWriteFunctionAsync(ContractAddress, ABI, 0, "submitResponse", requestId, decimals);
    }

    public async Task AcceptJobAsync(BigInteger jobId)
    {
        await _ethAccountServices.CallContractWriteFunctionAsync(ContractAddress, ABI, 0, "acceptJob", jobId);
    }

    public async Task<GetJobDetailsOutput> GetJobDetailsAsync(BigInteger jobId)
    {
        return await _ethAccountServices.CallContractReadFunctionAsync<GetJobDetailsFunction, GetJobDetailsOutput>(new GetJobDetailsFunction(){ JobId = jobId }, ContractAddress);
    }

    public async Task<bool> IsJobReadyAsync(BigInteger jobId)
    {
        return await _ethAccountServices.CallContractReadFunctionAsync<bool>(ContractAddress, ABI, "isJobReady", jobId);
    }

    public async Task<GetTotalRewardsOutput> GetTotalRewardsAsync()
    {
        return await _ethAccountServices.CallContractReadFunctionNoParamsAsync<GetTotalRewardsOutput>(ContractAddress, ABI, "getTotalRewards");
    }

    public async Task<bool> IsResponseSubmittedAsync(BigInteger jobId)
    {
        return await _ethAccountServices.CallContractReadFunctionAsync<bool>(ContractAddress, ABI, "isResponseSubmitted", jobId);
    }

    public async Task ClaimPendingRewardsAsync()
    {
        await _ethAccountServices.CallContractWriteFunctionAsync(ContractAddress, ABI, 0, "claimPendingRewards");
    }

    public async Task<GetPendingRewardJobIdsOutput> GetPendingRewardJobIdsAsync(string address)
    {
        return await _ethAccountServices.CallContractReadFunctionAsync<GetPendingRewardJobIdsOutput>(ContractAddress, ABI, "getPendingRewardJobIds", address);
    }

    private async Task<List<GetJobDetailsOutput>> FilterAndSortJobs(List<EventLog<JobRequestCreatedEvent>> eventlogs)
    {
        List<GetJobDetailsOutput> jobDetailsList = new();

        foreach (EventLog<JobRequestCreatedEvent> log in eventlogs)
        {
            GetJobDetailsOutput jobDetails = await GetJobDetailsAsync(log.Event.JobId);
            jobDetailsList.Add(jobDetails);
        }

        jobDetailsList = jobDetailsList.FindAll(jobDetails => (GetMinimumRewardsPerJob(jobDetails) >= BigInteger.Parse(_options.Value.MinimumJobReward))).ToList();

        jobDetailsList = jobDetailsList.OrderByDescending(jobDetails => GetMinimumRewardsPerJob(jobDetails)).ToList();

        return jobDetailsList;
    }

    public List<GetJobDetailsOutput> FilterAndSortJobs(List<GetJobDetailsOutput> jobDetailsList)
    {
        jobDetailsList = jobDetailsList.FindAll(jobDetails => (GetMinimumRewardsPerJob(jobDetails) >= BigInteger.Parse(_options.Value.MinimumJobReward))).ToList();

        jobDetailsList = jobDetailsList.OrderByDescending(jobDetails => GetMinimumRewardsPerJob(jobDetails)).ToList();

        return jobDetailsList;
    }

    public async Task ListenToJobRequestCreatedEventWithCallbackAsync(Func<GetJobDetailsOutput, string, Task> processRequest)
    {
        await _ethAccountServices.ListenContractEventAsync<JobRequestCreatedEvent>(ContractAddress, ABI, "JobRequestCreated", async (logs) =>
        {
            List<GetJobDetailsOutput> jobDetailsList = await FilterAndSortJobs(logs);

            foreach (GetJobDetailsOutput jobDetails in jobDetailsList) 
                _ = Task.Run(async () => await processRequest(jobDetails, "RECEIVED"));
            

            return true;
        });
    }

    public async Task ListenToNodeRegisteredEventWithCallbackAsync(Func<Task> startTasks)
    {
        await _ethAccountServices.ListenContractEventAsync<NodeRegisteredEvent>(ContractAddress, ABI, "NodeRegistered", (logs) =>
        {
            foreach (EventLog<NodeRegisteredEvent> log in logs)
            {
                _ = Task.Run(async () =>
                {
                    if (log.Event.NodeAddress == _ethAccountServices.Address)
                        await startTasks();
                });
            }

            return true;
        });
    }

    public async Task ListenToJobRequestFulfilledEventAsync()
    {
        await _ethAccountServices.ListenContractEventAsync<JobRequestFulfilledEventDTO>(ContractAddress, ABI, "JobRequestFulfilled", (logs) =>
        {
            foreach (EventLog<JobRequestFulfilledEventDTO> log in logs)
            {
                _ = Task.Run(async () =>
                {
                    GetPendingRewardJobIdsOutput jobIdsWithPendingRewards = await GetPendingRewardJobIdsAsync(_ethAccountServices.Address);

                    if (jobIdsWithPendingRewards.JobIds.Contains(log.Event.JobId))
                    {
                        _logger.LogInformation("Request fulfilled {0}", log.Event.JobId);
                        GetTotalRewardsOutput totalRewards = await GetTotalRewardsAsync();
                        if (
                            totalRewards.ADAReward >= BigInteger.Parse(_options.Value.ADARewardThreshold) &&
                            totalRewards.CNCLVReward >= BigInteger.Parse(_options.Value.CNCLVRewardThreshold))
                        {
                            _logger.LogInformation("Threshold reached. Claiming reward");
                            await ClaimPendingRewardsAsync();
                        }
                    }
                });
            }

            return true;
        });
    }

    public async Task ListenToJobRequestRefundedEventAsync()
    {
        await _ethAccountServices.ListenContractEventAsync<JobRequestRefundedEvent>(ContractAddress, ABI, "JobRequestFulfilled", (logs) =>
        {
            foreach (EventLog<JobRequestRefundedEvent> log in logs)
            {
                _ = Task.Run(async () =>
                {
                    GetPendingRewardJobIdsOutput jobIdsWithPendingRewards = await GetPendingRewardJobIdsAsync(_ethAccountServices.Address);

                    if (jobIdsWithPendingRewards.JobIds.Contains(log.Event.JobId))
                        _logger.LogInformation("Request refunded {0}", log.Event.JobId);

                });
            }

            return true;
        });
    }

    private BigInteger GetMinimumRewardsPerJob(GetJobDetailsOutput jobDetails)
    {
        BigInteger adaReward = jobDetails.ReturnValue1.BaseBaseTokenFee + jobDetails.ReturnValue1.BaseTokenFeePerNum * jobDetails.ReturnValue1.NumCount;
        BigInteger cnclvReward = jobDetails.ReturnValue1.BaseTokenFee + jobDetails.ReturnValue1.TokenFeePerNum * jobDetails.ReturnValue1.NumCount;
        BigInteger reward = (adaReward / jobDetails.ReturnValue1.MaxValidator) + (cnclvReward / jobDetails.ReturnValue1.MaxValidator);

        return reward;
    }
}