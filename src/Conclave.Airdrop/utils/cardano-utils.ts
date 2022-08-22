import { TransactionData } from '../types/response-types';
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

export const getProtocolParametersAsync = async (blockfrostAPI: BlockFrostAPI, epochNumber: number) => {
    return await blockfrostAPI.epochsParameters(epochNumber);
};

export const getCurrentEpochsAsync = async (blockfrostAPI: BlockFrostAPI) => {
    return await blockfrostAPI.epochsLatest();
};

export const getLatestBlockAsync = async (blockfrostAPI: BlockFrostAPI) => {
    return await blockfrostAPI.blocksLatest();
};

export const getLatestSlotAsync = async (blockfrostAPI: BlockFrostAPI) => {
    let latestBlock = await blockfrostAPI.blocksLatest();
    return latestBlock.slot;
};

export const submitTransactionToChain = async (blockfrostAPI: BlockFrostAPI, transaction: any) => {
    await blockfrostAPI.txSubmit(transaction);
};

export const getTransactionData = async (
    blockfrostAPI: BlockFrostAPI,
    txHashString: string
): Promise<TransactionData> => {
    const txData = await blockfrostAPI.txs(txHashString);
    return txData;
};

export const getBlock = async (blockfrostAPI: BlockFrostAPI, blockNumber: any) => {
    return await blockfrostAPI.blocks(blockNumber);
};

export const getUTXOsfromAddress = async (blockfrostAPI: BlockFrostAPI, address: string) => {
    return await blockfrostAPI.addressesUtxosAll(address);
};
