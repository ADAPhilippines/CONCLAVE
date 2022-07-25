import { ProtocolParametersResponse } from '../types/response-types';
import { getCurrentEpochsAsync, getProtocolParametersAsync } from '../utils/epoch-utils';
import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

export const getLatestProtocolParametersAsync = async (
	blockfrostAPI: BlockFrostAPI
): Promise<ProtocolParametersResponse> => {
	const currentEpoch = await getCurrentEpochsAsync(blockfrostAPI);
	const protocolParams = await getProtocolParametersAsync(blockfrostAPI, currentEpoch.epoch);

	return {
		min_fee_a: protocolParams.min_fee_a.toString(),
		min_fee_b: protocolParams.min_fee_b.toString(),
		poolDeposit: protocolParams.pool_deposit.toString(),
		keyDeposit: protocolParams.key_deposit.toString(),
		maxValueSize: Number(protocolParams.max_val_size) ?? 0,
		maxTxSize: protocolParams.max_tx_size,
		coinsPerUtxoWord: Number(protocolParams.coins_per_utxo_word).toString(),
	};
};

export const blockfrostAPI = new BlockFrostAPI({
	projectId: process.env.PROJECT_ID!,
});
