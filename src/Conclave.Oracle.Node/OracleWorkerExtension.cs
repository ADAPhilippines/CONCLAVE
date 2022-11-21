using Conclave.Oracle.Node.Utils;
using System.Numerics;
using Conclave.Oracle.Node.Helpers;
using Conclave.Oracle.Node.Contracts.Definition.FunctionOutputs;

namespace Conclave.Oracle;

public partial class OracleWorker : BackgroundService
{
    public async Task<bool> VerifyRegistrationAsync()
    {
        #region logs
        _logger.LogInformation("Checking if current account {0} is registered", _ethAccountServices.Address);
        #endregion

        return await _oracleContractService.IsNodeRegisteredAsync();
    }

    public async Task<bool> CheckIsJobReadyAfterAcceptanceExpirationAsync(GetJobDetailsOutputDTO jobDetails)
    {
        using (_logger.BeginScope("ACCEPTED: Job Id#: {0}", jobDetails.JobId))
            _logger.LogInformation("TimeStamp: {0}, Numbers: {1}\nAwaiting for job to be ready.", jobDetails.Timestamp, jobDetails.NumCount);

        //verify is it duration or fixed time
        await Task.Delay((int)jobDetails.JobAcceptanceExpiration);

        return await _oracleContractService.IsJobReadyAsync(jobDetails.JobId);
    }

    public async Task SubmitDecimalsAsync(BigInteger requestId, List<BigInteger> decimalsList)
    {
        await DelegationCheckerAsync();
        //log decimals
        await _oracleContractService.SubmitResponseAsync(requestId, decimalsList);

        LoggingHelper.LogWithScope<OracleWorker>(_logger, "Submitting job Id# : {0}", "Submitted", requestId);
    }

    public async Task<List<BigInteger>> GenerateDecimalsAsync(BigInteger requestId, BigInteger unixTimeS, BigInteger numberOfdecimals)
    {
        await DelegationCheckerAsync();

        List<string> blockHashesList = await GetBlockHashesFromUnixTimeSAsync(requestId, unixTimeS, numberOfdecimals);

        return StringUtils.HexStringListToBigIntegerList(blockHashesList);
    }

    public async Task DelegationCheckerAsync()
    {
        s_IsRegistered = await _oracleContractService.IsNodeRegisteredAsync();

        if (s_IsRegistered is false)
            ExitApplicationOnErrorWithMessage("Account no longer delegated.");
    }

    public async Task<List<string>> GetBlockHashesFromUnixTimeSAsync(BigInteger requestId, BigInteger unixTimeS, BigInteger numberOfdecimals)
    {
        string firstBlockHash = await _cardanoService.GetNearestBlockHashFromTimeSAsync((int)unixTimeS, requestId);

        return await _cardanoService.GetNextBlocksFromCurrentHashAsync(firstBlockHash, (int)(numberOfdecimals - 1), requestId);
    }

    public async Task<List<GetJobDetailsOutputDTO>> GetJobDetailsPerIdAsync(List<BigInteger> jobIdsList)
    {
        List<Task<GetJobDetailsOutputDTO>> jobDetailsTasks = jobIdsList.Select(async (jobId) => await _oracleContractService.GetJobDetailsAsync(jobId)).ToList();

        return (await Task.WhenAll(jobDetailsTasks)).ToList();
    }

    public async Task AwaitRegistrationAsync()
    {
        _logger.LogWarning("Account is not registered. Please delegate to address {0}\nDelegation may take a few seconds to confirm...", _ethAccountServices.Address);

        await _oracleContractService.ListenToNodeRegisteredEventWithCallbackAsync(StartTasksAsync);
    }

    public async Task GenerateAndSubmitDecimalsAsync(GetJobDetailsOutputDTO jobDetails)
    {
        using (_logger.BeginScope("ACCEPTED: Job Id#: {0}", jobDetails.JobId))
            _logger.LogInformation("Job is ready. Generating Numbers.");

        List<BigInteger> decimalsList = await GenerateDecimalsAsync(jobDetails.JobId, jobDetails.Timestamp, jobDetails.NumCount);

        await SubmitDecimalsAsync(jobDetails.JobId, decimalsList);
    }

    public void ExitApplicationOnErrorWithMessage(string message)
    {
        _logger.LogError(message);
        Environment.Exit(0);
    }
}