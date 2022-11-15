using System.Numerics;
using Blockfrost.Api;
using Conclave.Oracle.Node.Exceptions;

namespace Conclave.Oracle.Node.Services;

public class CardanoServices
{
    private readonly int RetryDurationMs = 3000;
    private readonly int MaxRetrials = 10;
    private readonly IBlockService _blockService;
    private readonly ILogger<CardanoServices> _logger;
    public CardanoServices(IBlockService iblockService, ILogger<CardanoServices> logger)
    {
        _blockService = iblockService;
        _logger = logger;
    }

    public async Task<string> GetNearestBlockHashFromTimeMs(int unixTime, BigInteger requestId)
    {
        BlockContentResponse? currentBlock = await GetLatestBlock();
        int currentTime = currentBlock!.Time;

        if (unixTime < currentTime)
        {
            while (unixTime < currentTime)
            {
                currentBlock = await GetBlockFromHash(currentBlock!.PreviousBlock);
                currentTime = currentBlock!.Time;
            }
            if (unixTime != currentTime)
                currentBlock = await GetBlockFromHash(currentBlock!.NextBlock);
        }
        else if (unixTime > currentTime)
        {
            while (unixTime > currentTime)
            {
                currentBlock = await WaitForNextBlock(currentBlock);
                currentBlock = await GetBlockFromHash(currentBlock!.NextBlock);
                currentTime = currentBlock!.Time;
            }
        }

        #region logs
        Console.WriteLine();
        Console.WriteLine("---------Request Id #: {0} (Nearest block etails)---------", requestId);
        Console.WriteLine("Block hash : {0}", currentBlock!.Hash);
        Console.WriteLine("Block slot : {0}", currentBlock!.Slot);
        Console.WriteLine("Block timestamp : {0}", currentBlock!.Time);
        #endregion
        return currentBlock!.Hash;
    }

    public async Task<List<string>> GetNextBlocksFromCurrentHash(string blockHash, int nextBlocks, BigInteger requestId)
    {
        List<string> blockHashes = new List<string>() { blockHash };
        List<BlockContentResponse>? blockresponse = new List<BlockContentResponse>();

        while (blockresponse?.Count < nextBlocks)
        {
            blockresponse = await GetNextBlocksFromHashAsync(blockHash, nextBlocks);
            await Task.Delay(20000 * (nextBlocks - blockresponse!.Count));
        }
        if (blockresponse is not null)
            blockHashes.AddRange(blockresponse.Select(r => r.Hash));

        #region logs
        Console.WriteLine("Compiled blockhashes : ");
        int i = 0;
        blockHashes.ForEach((b) =>
        {
            Console.WriteLine("[{0}] {1}", i, b);
            i++;
        });
        #endregion
        return blockHashes;
    }

    public async Task<BlockContentResponse?> WaitForNextBlock(BlockContentResponse? currentBlock)
    {
        while (currentBlock!.NextBlock is null)
        {
            currentBlock = await GetBlockFromHash(currentBlock.Hash);
            await Task.Delay(13000);
        }

        return currentBlock;
    }

    #region Pure BlockFrost Functions
    public async Task<List<BlockContentResponse>?> GetNextBlocksFromHashAsync(string blockHash, int nextBlocks)
    {
        int currentTrial = 0;
        while (currentTrial <= MaxRetrials)
        {
            try
            {
                return await _blockService.GetNextBlockAsync(blockHash, nextBlocks, 1) as List<BlockContentResponse>;
            }
            catch (ApiException e) when (currentTrial <= MaxRetrials)
            {
                _logger.LogError($"Error Getting Block: {e.Message}. Retrying in 3s");
                await Task.Delay(RetryDurationMs);
                currentTrial++;
            }
            catch (ApiException e) when (currentTrial > MaxRetrials)
            {
                _logger.LogError("Max number of trials exceeded...");
                throw new OracleNodeException($"Error getting Block: {e.Message}", e);
            }
        }
        return null;
    }

    public async Task<BlockContentResponse?> GetLatestBlock()
    {
        int currentTrial = 0;
        while (currentTrial <= MaxRetrials)
        {
            try
            {
                return await _blockService.GetLatestBlockAsync();
            }
            catch (ApiException e) when (e.StatusCode is 404)
            {
                return null;
            }
            catch (ApiException e) when (currentTrial <= MaxRetrials)
            {
                _logger.LogError($"Error Getting Block: {e.Message}. Retrying in 3s");
                await Task.Delay(RetryDurationMs);
                currentTrial++;
            }
            catch (ApiException e) when (currentTrial > MaxRetrials)
            {
                _logger.LogError("Max number of trials exceeded...");
                throw new OracleNodeException($"Error getting Block: {e.Message}", e);
            }
        }
        return null;
    }

    public async Task<BlockContentResponse?> GetBlockFromHash(string hash)
    {
        int currentTrial = 0;
        while (currentTrial <= MaxRetrials)
        {
            try
            {
                return await _blockService.GetBlocksAsync(hash);
            }
            catch (ApiException e) when (currentTrial <= MaxRetrials)
            {
                _logger.LogError($"Error Getting Block: {e.Message}. Retrying in 3s");
                await Task.Delay(RetryDurationMs);
                currentTrial++;
            }
            catch (ApiException e) when (currentTrial > MaxRetrials)
            {
                _logger.LogError("Max number of trials exceeded...");
                throw new OracleNodeException($"Error getting Block: {e.Message}", e);
            }
        }
        return null;
    }
    #endregion
}