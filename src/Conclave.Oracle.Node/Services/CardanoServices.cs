using System.Numerics;
using Blockfrost.Api;
using Conclave.Oracle.Node.Models;

namespace Conclave.Oracle.Node.Services;

public class CardanoServices
{
    #region constant variables
    private const int RETRIAL_DURATION = 3000;
    private const int BLOCK_DURATION = 17000;
    private const int STRING_LOG_MAX_LENGTH = 25;
    #endregion
    #region private variables
    private readonly IBlockService _blockService;
    private readonly ILogger<CardanoServices> _logger;
    #endregion
    public CardanoServices(IBlockService iblockService, ILogger<CardanoServices> logger)
    {
        _blockService = iblockService;
        _logger = logger;
        Environment.ExitCode = 0;
    }

    public async Task<BlockDetails> GetNearestBlockHashFromTimeSAsync(int unixTime, BigInteger requestId)
    {
        BlockContentResponse currentBlock = await GetLatestBlockAsync();

        if (unixTime < currentBlock.Time)
            currentBlock = await GetNearestBlockBeforeLatestAsync(currentBlock, unixTime, requestId);
        else if (unixTime > currentBlock.Time)
            currentBlock = await GetNearestBlockAfterLatestAsync(currentBlock, unixTime, requestId);

        using (_logger.BeginScope("Processing job Id# {0}", requestId.ToString("X")))
            _logger.LogInformation("Nearest block acquired : {0}", currentBlock.Height);

        return new BlockDetails(currentBlock.Hash, currentBlock.Height ?? 0);
    }

    public async Task<List<string>> GetNextBlocksFromCurrentHashAsync(string blockHash, int nextBlocks, BigInteger requestId, int? blockNumber)
    {
        if (nextBlocks is not 0)
            using (_logger.BeginScope("Processing job Id# {0}", requestId.ToString("X")))
                _logger.LogInformation("Getting succeeding blocks after block {0}.", blockNumber);

        List<string> blockHashesRes = new() { blockHash };
        List<BlockContentResponse>? blockresponse = new List<BlockContentResponse>();

        if (nextBlocks is 0)
            return blockHashesRes;

        blockresponse = await GetNextBlocksFromHashAsync(blockHash, nextBlocks);

        while (blockresponse?.Count < nextBlocks)
            blockresponse = await AwaitRemainingBlocksAsync(nextBlocks, blockresponse!.Count, blockHash, requestId);

        blockHashesRes.AddRange(blockresponse!.Select(r => r.Hash));

        //TODO: create logging utils
        string blockHashesLogs = string.Empty;
        blockHashesLogs += string.Format("[{0}] {1} - {2}\n", 0, blockNumber, blockHash);
        blockresponse?.ForEach((b) =>
        {
            //TODO: convert to function
            int i = blockresponse.IndexOf(b);
            if (b == blockresponse.Last())
                blockHashesLogs += string.Format("[{0}] {1} - {2}", i + 1, b.Height, b.Hash);
            else
                blockHashesLogs += string.Format("[{0}] {1} - {2}\n", i + 1, b.Height, b.Hash);
        });

        using (_logger.BeginScope("Processing job Id# {0}", requestId.ToString("X")))
        using (_logger.BeginScope("Block hashes", requestId))
            _logger.LogInformation(blockHashesLogs);

        return blockHashesRes;
    }

    private async Task<List<BlockContentResponse>?> AwaitRemainingBlocksAsync(int nextBlocks, int currentCount, string blockHash, BigInteger requestId)
    {
        using (_logger.BeginScope("Processing job Id# {0}", requestId.ToString("X")))
            _logger.LogInformation("Awaiting {0} remaining blocks", nextBlocks - currentCount);

        await Task.Delay(BLOCK_DURATION * (nextBlocks - currentCount));

        return await GetNextBlocksFromHashAsync(blockHash, nextBlocks);
    }

    private async Task<BlockContentResponse> WaitForNextBlockAsync(BlockContentResponse currentBlock, BigInteger requestId)
    {
        if (currentBlock.NextBlock is null)
            using (_logger.BeginScope("Processing job Id# {0}", requestId.ToString("X")))
                _logger.LogInformation("Awaiting next block after {0}.", currentBlock.Height);

        while (currentBlock.NextBlock is null)
            currentBlock = await RefetchBlockAsync(currentBlock.Hash);

        return currentBlock;
    }

    private async Task<BlockContentResponse> RefetchBlockAsync(string blockHash)
    {
        await Task.Delay(BLOCK_DURATION);

        return await GetBlockFromHashAsync(blockHash);
    }

    private async Task<BlockContentResponse> GetNearestBlockBeforeLatestAsync(BlockContentResponse currentBlock, int unixTime, BigInteger requestId)
    {
        using (_logger.BeginScope("Processing job Id# {0}", requestId.ToString("X")))
            _logger.LogInformation("Getting nearest block from timestamp {0}.", unixTime);

        while (unixTime < currentBlock.Time)
            currentBlock = await GetBlockFromHashAsync(currentBlock.PreviousBlock);

        if (unixTime != currentBlock.Time)
            currentBlock = await GetBlockFromHashAsync(currentBlock.NextBlock);

        return currentBlock;
    }

    private async Task<BlockContentResponse> GetNearestBlockAfterLatestAsync(BlockContentResponse currentBlock, int unixTime, BigInteger requestId)
    {
        using (_logger.BeginScope("Processing job Id# {0}", requestId.ToString("X")))
            _logger.LogInformation("Awaiting nearest block from timestamp {0}.", unixTime);

        await Task.Delay(unixTime - currentBlock.Time + BLOCK_DURATION);

        while (unixTime > currentBlock.Time)
        {
            currentBlock = await WaitForNextBlockAsync(currentBlock, requestId);
            currentBlock = await GetBlockFromHashAsync(currentBlock!.NextBlock);
        }

        return currentBlock;
    }

    #region Native CardanoNetwork Functions
    private async Task<List<BlockContentResponse>?> GetNextBlocksFromHashAsync(string blockHash, int nextBlocks)
    {
        //TODO: convert to simpler function
        while (true)
        {
            try
            {
                return await _blockService.GetNextBlockAsync(blockHash, nextBlocks, 1) as List<BlockContentResponse>;
            }
            catch (ApiException e) when (e.StatusCode is 403)
            {
                //TODO: convert to error handler utils
                _logger.LogError(e, "Error Getting Next Blocks: {0}. Closing the application.", e.Message);
                Environment.Exit(Environment.ExitCode);
            }
            catch (ApiException e)
            {
                //TODO: convert to error handler utils
                _logger.LogError(e, "Error Getting Next Blocks: {0}. Retrying...", e.Message);
                await Task.Delay(RETRIAL_DURATION);
            }
        }
    }

    private async Task<BlockContentResponse> GetLatestBlockAsync()
    {
        //TODO: convert to simpler function
        while (true)
        {
            try
            {
                return await _blockService.GetLatestBlockAsync();
            }
            catch (ApiException e) when (e.StatusCode is 403)
            {
                //TODO: convert to error handler utils
                _logger.LogError(e, "Error Getting Latest Block: {0}. Closing the application.", e.Message);
                Environment.Exit(Environment.ExitCode);
            }
            catch (ApiException e)
            {
                //TODO: convert to error handler utils
                _logger.LogError(e, "Error Getting Latest Block: {0}. Retrying...", e.Message);
                await Task.Delay(RETRIAL_DURATION);
            }
        }
    }

    private async Task<BlockContentResponse> GetBlockFromHashAsync(string hash)
    {
        //TODO: convert to simpler function
        while (true)
        {
            try
            {
                return await _blockService.GetBlocksAsync(hash);
            }
            catch (ApiException e) when (e.StatusCode is 403)
            {
                //TODO: convert to error handler utils
                _logger.LogError(e, "Error Getting Latest Block: {0}. Closing the application.", e.Message);
                Environment.Exit(Environment.ExitCode);
            }
            catch (ApiException e)
            {
                //TODO: convert to error handler utils
                _logger.LogError(e, "Error Getting Block: {0}. Retrying...", e.Message);
                await Task.Delay(RETRIAL_DURATION);
            }
        }
    }
    #endregion
}