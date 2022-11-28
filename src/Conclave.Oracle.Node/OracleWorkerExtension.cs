using Conclave.Oracle.Node.Utils;
using System.Numerics;
using Conclave.Oracle.Node.Models;
using Conclave.Oracle.Node.Contracts.Definition;

namespace Conclave.Oracle;

public partial class OracleWorker : BackgroundService
{
    public async Task<bool> VerifyRegistrationAsync()
    {
        _logger.LogInformation("Checking if current account {0} is registered", _ethAccountServices.Address);

        return await _oracleContractService.IsNodeRegisteredAsync();
    }

    public async Task<bool> CheckIsJobReadyAfterAcceptanceExpirationAsync(GetJobDetailsOutput jobDetails)
    {
        using (_logger.BeginScope("ACCEPTED: Job Id# {0}", jobDetails.ReturnValue1.JobId.ToString("X")))
            _logger.LogInformation("Awaiting job to be ready.");

        DateTime foo = DateTime.Now;
        int currentUnixTimeS = (int)((DateTimeOffset)foo).ToUnixTimeSeconds();

        await Task.Delay(((int)jobDetails.ReturnValue1.JobAcceptanceExpiration - currentUnixTimeS) * 1000);

        return await _oracleContractService.IsJobReadyAsync(jobDetails.ReturnValue1.JobId);
    }

    public async Task SubmitDecimalsAsync(GetJobDetailsOutput jobDetail, List<BigInteger> decimalsList, long unixTimeMs)
    {
        //TODO: create logger utils
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

        using (_logger.BeginScope("ACCEPTED: Job Id# {0}", jobDetail.ReturnValue1.JobId.ToString("X")))
        using (_logger.BeginScope("Decimals", jobDetail.ReturnValue1.JobId))
            _logger.LogInformation(decimalLogs);

        await _oracleContractService.SubmitResponseAsync(jobDetail.ReturnValue1.JobId, decimalsList);

        long currentUnixTimeMs = DateTimeOffset.Now.ToUnixTimeMilliseconds();
        decimal processTime = ((decimal)currentUnixTimeMs - (decimal)unixTimeMs) / 1000;
        
        using (_logger.BeginScope("Submitting job Id# {0}", jobDetail.ReturnValue1.JobId.ToString("X")))
            _logger.LogInformation("Submitted - {0}s", processTime);
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
            ExitApplicationWithErrorMessage("Account no longer delegated.");
    }

    public async Task<List<string>> GetBlockHashesFromUnixTimeSAsync(BigInteger requestId, BigInteger unixTimeS, BigInteger numberOfdecimals)
    {
        BlockDetails nearestBlock = await _cardanoService.GetNearestBlockHashFromTimeSAsync((int)unixTimeS, requestId);

        return await _cardanoService.GetNextBlocksFromCurrentHashAsync(nearestBlock.BlockHash, (int)(numberOfdecimals - 1), requestId, nearestBlock.BlockNumber);
    }

    public List<GetJobDetailsOutput> GetJobDetailsPerId(List<BigInteger> jobIdsList)
    {
        List<GetJobDetailsOutput> jobDetailsList = new();

        jobIdsList.ForEach(async jobId =>
        {
            GetJobDetailsOutput jobDetails = await _oracleContractService.GetJobDetailsAsync(jobId);
            jobDetailsList.Add(jobDetails);
        });

        return jobDetailsList;
    }

    public async Task AwaitRegistrationAsync()
    {
        _logger.LogWarning("Account is not registered. Please delegate to address {0}\nDelegation may take a few seconds to confirm.", _ethAccountServices.Address);

        await _oracleContractService.ListenToNodeRegisteredEventWithCallbackAsync(StartTasksAsync);
    }

    public async Task GenerateAndSubmitDecimalsAsync(GetJobDetailsOutput jobDetails)
    {
        using (_logger.BeginScope("ACCEPTED: Job Id# {0}", jobDetails.ReturnValue1.JobId.ToString("X")))
            _logger.LogInformation("Job is ready. Generating Numbers.");

        long startUnixTimeMs = DateTimeOffset.Now.ToUnixTimeMilliseconds();

        List<BigInteger> decimalsList = await GenerateDecimalsAsync(jobDetails.ReturnValue1.JobId, jobDetails.ReturnValue1.Timestamp, jobDetails.ReturnValue1.NumCount);

        await SubmitDecimalsAsync(jobDetails, decimalsList, startUnixTimeMs);
    }

    public void ExitApplicationWithErrorMessage(string message)
    {
        _logger.LogError(message);
        Environment.Exit(0);
    }
}