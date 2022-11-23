using Conclave.Oracle.Node.Utils;
using System.Numerics;
using Conclave.Oracle.Node.Helpers;
using Conclave.Oracle.Node.Contracts.Definition.FunctionOutputs;
using Conclave.Oracle.Node.Contracts.Definition.EventOutputs;

namespace Conclave.Oracle;

public partial class OracleWorker : BackgroundService
{
    public async Task<bool> VerifyRegistrationAsync()
    {
        _logger.LogInformation("Checking if current account {0} is registered", _ethAccountServices.Address);

        return await _oracleContractService.IsNodeRegisteredAsync();
    }

    public async Task<bool> CheckIsJobReadyAfterAcceptanceExpirationAsync(GetJobDetailsOutputDTO jobDetails)
    {
        using (_logger.BeginScope("ACCEPTED: Job Id#: {0}", jobDetails.JobId))
            _logger.LogInformation("Awaiting job to be ready.");

        DateTime foo = DateTime.Now;
        int currentUnixTime = (int)((DateTimeOffset)foo).ToUnixTimeSeconds();

        // await Task.Delay(((int)jobDetails.JobAcceptanceExpiration - currentUnixTime)*1000);
        await Task.Delay(10000);

        return await _oracleContractService.IsJobReadyAsync(jobDetails.JobId);
    }

    public async Task SubmitDecimalsAsync(BigInteger requestId, List<BigInteger> decimalsList)
    {
        string decimalLogs = string.Empty;
        decimalsList.ForEach((b) =>
        {
            //convert to function
            int i = decimalsList.IndexOf(b);
            if (b == decimalsList.Last())
                decimalLogs += string.Format("[{0}] {1}", i, b);
            else
                decimalLogs += string.Format("[{0}] {1}\n", i, b);
        });

        using (_logger.BeginScope("Submitting job Id# : {0}", requestId))
            using (_logger.BeginScope("Decimals", requestId))
                _logger.LogInformation(decimalLogs);

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

    public List<GetJobDetailsOutputDTO> GetJobDetailsPerIdAsync(List<BigInteger> jobIdsList)
    {
        // List<Task<GetJobDetailsOutputDTO>> jobDetailsTasks = jobIdsList.Select(async (jobId) => await _oracleContractService.GetJobDetailsAsync(jobId)).ToList();
        List<GetJobDetailsOutputDTO> jobDetailsList = new();

        jobIdsList.ForEach(async jobId => {
            GetJobDetailsOutputDTO jobDetails = await _oracleContractService.GetJobDetailsAsync(jobId);
            jobDetailsList.Add(jobDetails);
        });

        return jobDetailsList;
    }

    public async Task AwaitRegistrationAsync()
    {
        _logger.LogWarning("Account is not registered. Please delegate to address {0}\nDelegation may take a few seconds to confirm.", _ethAccountServices.Address);

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