using Conclave.Oracle.Node.Models;
using Microsoft.Extensions.Options;
using Conclave.Oracle.Node.Services.Bases;
using System.Numerics;
using Nethereum.Contracts;
using Conclave.Oracle.Node.Contracts.Definition.EventOutputs;
using Conclave.Oracle.Node.Contracts.Definition.FunctionOutputs;
using Nethereum.Hex.HexTypes;

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

    public async Task<GetPendingJobIdsOutputDTO> GetPendingJobIdsAsync()
    {
        return await _ethAccountServices.CallContractReadFunctionNoParamsAsync<GetPendingJobIdsOutputDTO>(ContractAddress, ABI, "getPendingJobIds");
    }

    public async Task SubmitResponseAsync(BigInteger requestId, List<BigInteger> decimals)
    {
        await _ethAccountServices.CallContractWriteFunctionAsync(ContractAddress, ABI, 0, "submitResponse", requestId, decimals);
    }

    public async Task AcceptJobAsync(BigInteger jobId)
    {
        await _ethAccountServices.CallContractWriteFunctionAsync(ContractAddress, ABI, 0, "acceptJob", jobId);
    }

    public async Task<GetJobDetailsOutputDTO> GetJobDetailsAsync(BigInteger jobId)
    {
        return await _ethAccountServices.CallContractReadFunctionAsync<GetJobDetailsOutputDTO>(ContractAddress, ABI, "getJobDetails", jobId);
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
        await _ethAccountServices.CallContractWriteFunctionNoParamsAsync(ContractAddress, ABI, 0, "claimPendingRewards");
    }

    public async Task<GetPendingRewardJobIdsOutputDTO> GetPendingRewardJobIds(string address)
    {
        return await _ethAccountServices.CallContractReadFunctionAsync<GetPendingRewardJobIdsOutputDTO>(ContractAddress, ABI, "getPendingRewardJobIds", address);
    }

    public async Task ListenToJobRequestCreatedEventWithCallbackAsync(Func<GetJobDetailsOutputDTO, string, Task> processRequest)
    {
        await _ethAccountServices.ListenContractEventAsync<JobRequestCreatedEventDTO>(ContractAddress, ABI, "JobRequestCreated", (logs) =>
        {
            // List<GetJobDetailsOutputDTO> jobDetailsList = new();

            // logs.ForEach(async (log) => {
            //     GetJobDetailsOutputDTO jobDetails = await GetJobDetailsAsync(log.Event.JobId);

            //     jobDetailsList.Add(jobDetails);
            // });

            // jobDetailsList = jobDetailsList.FindAll(j => {
            //     BigInteger reward = ((j.BaseBaseTokenFee + j.BaseTokenFeePerNum*j.NumCount)/j.MaxValidator) + ((j.BaseTokenFee + j.TokenFeePerNum*j.NumCount)/j.MaxValidator);
            //     return ( reward >= BigInteger.Parse(_options.Value.MinimumJobReward));
            // });

            // jobDetailsList = jobDetailsList.OrderByDescending(j => {
            //     BigInteger reward = ((j.BaseBaseTokenFee + j.BaseTokenFeePerNum*j.NumCount)/j.MaxValidator) + ((j.BaseTokenFee + j.TokenFeePerNum*j.NumCount)/j.MaxValidator);
            //     return (BigInteger.Parse(_options.Value.MinimumJobReward));
            // }).ToList();

            // jobDetailsList.ForEach(j => {
            //     BigInteger reward = ((j.BaseBaseTokenFee + j.BaseTokenFeePerNum*j.NumCount)/j.MaxValidator) + ((j.BaseTokenFee + j.TokenFeePerNum*j.NumCount)/j.MaxValidator);
            //     Console.WriteLine(reward);
            // });

            foreach (EventLog<JobRequestCreatedEventDTO> log in logs)
            {
                //if request reward is greater than jobreward threshold
                _ = Task.Run(async () =>
                {
                    GetJobDetailsOutputDTO jobDetails = await GetJobDetailsAsync(log.Event.JobId);

                    await processRequest(jobDetails, "RECEIVED");
                });
            }
            return true;
        });
    }

    public async Task ListenToNodeRegisteredEventWithCallbackAsync(Func<Task> startTasks)
    {
        await _ethAccountServices.ListenContractEventAsync<NodeRegisteredEventDTO>(ContractAddress, ABI, "NodeRegistered", (logs) =>
        {
            foreach (EventLog<NodeRegisteredEventDTO> log in logs)
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
                    GetPendingRewardJobIdsOutputDTO jobIdsWithPendingRewards = await GetPendingRewardJobIds(_ethAccountServices.Address);

                    if (jobIdsWithPendingRewards.JobIds.Contains(log.Event.JobId))
                    {
                        _logger.LogInformation("Request fulfilled {0}", log.Event.JobId);
                        GetTotalRewardsOutputDTO totalRewards = await GetTotalRewardsAsync();
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
        await _ethAccountServices.ListenContractEventAsync<JobRequestRefundedEventDTO>(ContractAddress, ABI, "JobRequestFulfilled", (logs) =>
        {
            foreach (EventLog<JobRequestRefundedEventDTO> log in logs)
            {
                _ = Task.Run(async () =>
                {
                    GetPendingRewardJobIdsOutputDTO jobIdsWithPendingRewards = await GetPendingRewardJobIds(_ethAccountServices.Address);

                    if (jobIdsWithPendingRewards.JobIds.Contains(log.Event.JobId))
                    {
                        _logger.LogInformation("Request refunded {0}", log.Event.JobId);
                    }
                });
            }
            return true;
        });
    }
}