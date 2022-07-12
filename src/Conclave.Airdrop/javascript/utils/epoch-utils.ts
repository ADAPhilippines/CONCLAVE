import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

export const getProtocolParametersAsync = async (blockfrostAPI: BlockFrostAPI, epochNumber: number) => {
    return await blockfrostAPI.epochsParameters(epochNumber);
}

export const getCurrentEpochsAsync = async (blockfrostAPI: BlockFrostAPI) => {
    return await blockfrostAPI.epochsLatest();
}
