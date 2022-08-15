import { ProtocolParametersResponse } from '../types/response-types';
import { getCurrentEpochsAsync, getProtocolParametersAsync } from '../utils/blockFrost-tools';
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

export const getLatestProtocolParametersAsync = async (): Promise<ProtocolParametersResponse> => {
	const currentEpoch = await getCurrentEpochsAsync();
	const protocolParams = await getProtocolParametersAsync(currentEpoch.epoch);

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
