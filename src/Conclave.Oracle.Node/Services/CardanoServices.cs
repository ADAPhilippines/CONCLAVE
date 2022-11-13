using Blockfrost.Api;

namespace Conclave.Oracle.Node.Services;

public class CardanoServices
{
    private readonly IBlockService _blockService;
    public CardanoServices(IBlockService iblockService)
    {
        _blockService = iblockService;
    }

    public async Task<string> GetNearestBlockHashFromSlot(int slot)
    {
        BlockContentResponse? blockBefore = null;
        BlockContentResponse? blockAfter = null;
        int blockDelta = 0;

        while (blockAfter is null && blockBefore is null)
        {
            blockAfter = await GetBlockFromSlot(slot + blockDelta);
            if (slot is not 0)
                blockBefore = await GetBlockFromSlot(slot - blockDelta);
            blockDelta++;
        }
        return blockAfter?.Hash ?? blockBefore?.Hash!;
    }

    public async Task<BlockContentResponse?> GetBlockFromSlot(int slot)
    {
        try
        {
            return await _blockService.GetSlotAsync(slot);
        }
        catch
        {
            return null;
        }
    }

    public async Task<List<string>> GetNextBlocksFromCurrentHash(string blockHash, int nextBlocks)
    {
        List<string> blockHashes = new List<string>() { blockHash };
        List<BlockContentResponse>? blockresponse = null;

        if (nextBlocks is not 0)
            blockresponse = await _blockService.GetNextBlockAsync(blockHash, nextBlocks, 1) as List<BlockContentResponse>;
        if (blockresponse is not null)
            blockHashes.AddRange(blockresponse.Select(r => r.Hash));

        return blockHashes;
    }
}