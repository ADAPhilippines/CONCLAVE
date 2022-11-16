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
    }

    public async Task<string> GetNearestBlockHashFromTimeMsAsync(int unixTime, BigInteger requestId)
    {
        #region logs
        _logger.BeginScope("Processing request Id#: {0}", requestId);
        _logger.LogInformation("Getting nearest block hash.");
        #endregion

        BlockContentResponse currentBlock = await GetLatestBlockAsync();
        int currentTime = currentBlock!.Time;

        if (unixTime < currentTime)
        {
            while (unixTime < currentTime)
            {
                currentBlock = await GetBlockFromHashAsync(currentBlock.PreviousBlock);
                currentTime = currentBlock!.Time;
            }
            if (unixTime != currentTime)
                currentBlock = await GetBlockFromHashAsync(currentBlock.NextBlock);
        }
        else if (unixTime > currentTime)
        {
            while (unixTime > currentTime)
            {
                _logger.LogInformation("Waiting for next block of {0}.", currentBlock.Hash);
                currentBlock = await WaitForNextBlockAsync(currentBlock, requestId);
                currentBlock = await GetBlockFromHashAsync(currentBlock!.NextBlock);
                currentTime = currentBlock!.Time;
                await Task.Delay(BLOCK_DURATION);
            }
        }

        #region logs
        _logger.LogInformation("Nearest block hash : {0}", currentBlock.Hash);
        #endregion
        return currentBlock.Hash;
    }

    public async Task<List<string>> GetNextBlocksFromCurrentHashAsync(string blockHash, int nextBlocks, BigInteger requestId)
    {
        #region logs
        _logger.BeginScope("Processing request Id#: {0}", requestId);
        if (nextBlocks is not 0)
            _logger.LogInformation("Getting succeeding blocks after {0}.", blockHash);
        #endregion

        List<string> blockHashes = new() { blockHash };
        List<BlockContentResponse>? blockresponse = new List<BlockContentResponse>();

        if (nextBlocks is not 0)
            blockresponse = await GetNextBlocksFromHashAsync(blockHash, nextBlocks);

        while (blockresponse?.Count < nextBlocks - 1)
        {
            _logger.LogInformation("Waiting {0} remaining blocks.", nextBlocks - blockresponse.Count);
            blockresponse = await GetNextBlocksFromHashAsync(blockHash, nextBlocks);
            await Task.Delay(BLOCK_DURATION * (nextBlocks - blockresponse!.Count));
        }

        if (blockresponse is not null)
            blockHashes.AddRange(blockresponse.Select(r => r.Hash));

        #region logs
        string blockHashesLogs = string.Empty;
        blockHashes.ForEach((b) =>
        {
            int i = blockHashes.IndexOf(b);
            if (b == blockHashes.Last())
                blockHashesLogs += string.Format("[{0}] {1}", i, b);
            else
                blockHashesLogs += string.Format("[{0}] {1}\n", i, b);
        });

        using (_logger.BeginScope("Block hash/es", requestId))
            _logger.LogInformation(blockHashesLogs);
        #endregion
        return blockHashes;
    }

    public async Task<BlockContentResponse> WaitForNextBlockAsync(BlockContentResponse currentBlock, BigInteger requestId)
    {
        #region logs
        _logger.BeginScope("Processing request Id#: {0}", requestId);
        _logger.LogInformation("Waiting next blocks of {0}.", currentBlock.Hash);
        #endregion

        while (currentBlock!.NextBlock is null)
        {
            currentBlock = await GetBlockFromHashAsync(currentBlock.Hash);
            await Task.Delay(BLOCK_DURATION);
        }

        #region logs
        _logger.LogInformation("Next block of {0} found : {1}", currentBlock.Hash, currentBlock.NextBlock);
        #endregion
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
                _hostApplicationLifetime.StopApplication();
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
                _hostApplicationLifetime.StopApplication();
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
                _hostApplicationLifetime.StopApplication();
            }
            catch (ApiException e)
            {
                _logger.LogError("Error Getting Block: {0}. Retrying...", e.Message);
                await Task.Delay(RETRIAL_DURATION);
            }
        }
    }
    #endregion
}