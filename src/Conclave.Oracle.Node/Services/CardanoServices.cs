using System.Numerics;
using Blockfrost.Api;

namespace Conclave.Oracle.Node.Services;

public class CardanoServices
{
    #region constant variables
    private const int RETRIAL_DURATION = 3000;
    private const int BLOCK_DURATION = 20000;
    #endregion
    #region private variables
    private readonly IBlockService _blockService;
    private readonly ILogger<CardanoServices> _logger;
    private readonly IHostApplicationLifetime _hostApplicationLifetime;
    #endregion
    public CardanoServices(IBlockService iblockService, ILogger<CardanoServices> logger, IHostApplicationLifetime hostApplicationLifetime)
    {
        _blockService = iblockService;
        _logger = logger;
        _hostApplicationLifetime = hostApplicationLifetime;
        Environment.ExitCode = 0;
    }

    public async Task<string> GetNearestBlockHashFromTimeSAsync(int unixTime, BigInteger requestId)
    {
        #region logs
        _logger.BeginScope("Processing request Id# : {0}", requestId);
        #endregion

        BlockContentResponse currentBlock = await GetLatestBlockAsync();

        if (unixTime < currentBlock.Time)
            currentBlock = await GetNearestBlockBeforeLatestAsync(currentBlock, unixTime);
        else if (unixTime > currentBlock.Time)
            currentBlock = await GetNearestBlockAfterLatestAsync(currentBlock, unixTime, requestId);

        #region logs
        _logger.LogInformation("Nearest block acquired : {0}", currentBlock.Hash);
        #endregion
        return currentBlock.Hash;
    }

    public async Task<List<string>> GetNextBlocksFromCurrentHashAsync(string blockHash, int nextBlocks, BigInteger requestId)
    {
        #region logs
        _logger.BeginScope("Processing request Id# : {0}", requestId);
        if (nextBlocks is not 0)
            _logger.LogInformation("Getting succeeding blocks after {0}.", blockHash);
        #endregion

        List<string> blockHashesRes = new() { blockHash };
        List<BlockContentResponse>? blockresponse = new List<BlockContentResponse>();

        if (nextBlocks is 0)
            return blockHashesRes;

        blockresponse = await GetNextBlocksFromHashAsync(blockHash, nextBlocks);

        while (blockresponse?.Count < nextBlocks - 1)
            blockresponse = await AwaitRemainingBlocksAsync(nextBlocks, blockresponse!.Count, blockHash);

        blockHashesRes.AddRange(blockresponse!.Select(r => r.Hash));

        #region logs
        string blockHashesLogs = string.Empty;
        blockHashesRes.ForEach((b) =>
        {
            //convert to function
            int i = blockHashesRes.IndexOf(b);
            if (b == blockHashesRes.Last())
                blockHashesLogs += string.Format("[{0}] {1}", i, b);
            else
                blockHashesLogs += string.Format("[{0}] {1}\n", i, b);
        });

        using (_logger.BeginScope("Block hashes", requestId))
            _logger.LogInformation(blockHashesLogs);
        #endregion
        return blockHashesRes;
    }

    public async Task<List<BlockContentResponse>?> AwaitRemainingBlocksAsync(int nextBlocks, int currentCount, string blockHash)
    {
        await Task.Delay(BLOCK_DURATION * (nextBlocks - currentCount));
        _logger.LogInformation("Awaiting {0} remaining blocks", nextBlocks - currentCount);
        
        return await GetNextBlocksFromHashAsync(blockHash, nextBlocks);
    }

    private async Task<BlockContentResponse> WaitForNextBlockAsync(BlockContentResponse currentBlock, BigInteger requestId)
    {
        #region logs
        if (currentBlock.NextBlock is null)
        {
            _logger.BeginScope("Processing request Id# : {0}", requestId);
            _logger.LogInformation("Awaiting next block after tip {0}.", currentBlock.Hash);
        }
        #endregion

        while (currentBlock.NextBlock is null)
            currentBlock = await ReQueryBlock(currentBlock.Hash);

        return currentBlock;
    }

    private async Task<BlockContentResponse> ReQueryBlock(string blockHash)
    {
        await Task.Delay(BLOCK_DURATION);
        return await GetBlockFromHashAsync(blockHash);
    }

    private async Task<BlockContentResponse> GetNearestBlockBeforeLatestAsync(BlockContentResponse currentBlock, int unixTime)
    {
        _logger.LogInformation("Getting nearest block from timestamp {0}.", unixTime);

        while (unixTime < currentBlock.Time)
            currentBlock = await GetBlockFromHashAsync(currentBlock.PreviousBlock);

        if (unixTime != currentBlock.Time)
            currentBlock = await GetBlockFromHashAsync(currentBlock.NextBlock);

        return currentBlock;
    }

    private async Task<BlockContentResponse> GetNearestBlockAfterLatestAsync(BlockContentResponse currentBlock, int unixTime, BigInteger requestId)
    {
        _logger.LogInformation("Awaiting nearest block from timestamp {0}.", unixTime);

        await Task.Delay(unixTime - currentBlock.Time + BLOCK_DURATION);

        while (unixTime > currentBlock.Time)
        {
            currentBlock = await WaitForNextBlockAsync(currentBlock, requestId);
            currentBlock = await GetBlockFromHashAsync(currentBlock!.NextBlock);
        }

        return currentBlock;
    }

    #region Native BlockFrost Functions
    private async Task<List<BlockContentResponse>?> GetNextBlocksFromHashAsync(string blockHash, int nextBlocks)
    {
        while (true)
        {
            try
            {
                return await _blockService.GetNextBlockAsync(blockHash, nextBlocks, 1) as List<BlockContentResponse>;
            }
            catch (ApiException e) when (e.StatusCode is 403)
            {
                _logger.LogError("Error Getting Next Blocks: {0}. Closing the application.", e.Message);
                Environment.Exit(Environment.ExitCode);
            }
            catch (ApiException e)
            {
                _logger.LogError("Error Getting Next Blocks: {0}. Retrying...", e.Message);
                await Task.Delay(RETRIAL_DURATION);
            }
        }
    }

    private async Task<BlockContentResponse> GetLatestBlockAsync()
    {
        while (true)
        {
            try
            {
                return await _blockService.GetLatestBlockAsync();
            }
            catch (ApiException e) when (e.StatusCode is 403)
            {
                _logger.LogError("Error Getting Latest Block: {0}. Closing the application.", e.Message);
                Environment.Exit(Environment.ExitCode);
            }
            catch (ApiException e)
            {
                _logger.LogError("Error Getting Latest Block: {0}. Retrying...", e.Message);
                await Task.Delay(RETRIAL_DURATION);
            }
        }
    }

    private async Task<BlockContentResponse> GetBlockFromHashAsync(string hash)
    {
        while (true)
        {
            try
            {
                return await _blockService.GetBlocksAsync(hash);
            }
            catch (ApiException e) when (e.StatusCode is 403)
            {
                _logger.LogError("Error Getting Latest Block: {0}. Closing the application.", e.Message);
                Environment.Exit(Environment.ExitCode);
            }
            catch (ApiException e)
            {
                _logger.LogError("Error Getting Block: {0}. Retrying...", e.Message);
                await Task.Delay(RETRIAL_DURATION);
            }
        }
    }

    // private async Task<T> EnsureBlockFrostIsNotError<T>()
    #endregion
}