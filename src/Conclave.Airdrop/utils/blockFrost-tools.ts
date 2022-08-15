import { blockfrostAPI } from '../config/network.config';
import { TransactionData } from '../types/response-types';

export const getProtocolParametersAsync = async (epochNumber: number) => {
	return await blockfrostAPI.epochsParameters(epochNumber);
};

export const getCurrentEpochsAsync = async () => {
	return await blockfrostAPI.epochsLatest();
};

export const getLatestBlockAsync = async () => {
	return await blockfrostAPI.blocksLatest();
};

export const getLatestSlotAsync = async () => {
	let latestBlock = await blockfrostAPI.blocksLatest();
	return latestBlock.slot;
};

export const submitTransactionToChain = async (transaction: any) => {
	await blockfrostAPI.txSubmit(transaction);
};

export const getTransactionData = async (txHashString: string): Promise<TransactionData> => {
	const txData = await blockfrostAPI.txs(txHashString);
	return txData;
};

export const getBlock = async (blockNumber: any) => {
	return await blockfrostAPI.blocks(blockNumber);
};

export const getUTXOsfromAddress = async (address: string) => {
	return await blockfrostAPI.addressesUtxosAll(address);
};
