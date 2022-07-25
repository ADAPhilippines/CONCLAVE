import { ProtocolParametersResponse, RewardTxBodyDetails, TxBodyInput } from '../../types/response-types';
import { isNull } from '../boolean-utils';
import { calculateRewardFeesAsync } from '../fees-utils';
import { initRewardTxBodyDetails } from '../type-utils';
import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';
import { setTTLAsync } from '../transaction-utils';
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import { setTxInputs } from './txInput-utils';
import { setRewardTxOutputs } from './txOutput-utils';
import { getLatestProtocolParametersAsync } from '../../config/network.config';
import { getTransactionBuilder } from '../../config/transaction.config';
import { PendingReward } from '../../types/helper-types';
import { setTimeout } from 'timers/promises';
import { SHELLEY_CHANGE_ADDRESS } from '../../config/walletKeys.config';

const blockfrostAPI = new BlockFrostAPI({
	projectId: 'testnet4Zo3x6oMtftyJH0X0uutC1RflLn8JtWR',
	isTestnet: true,
});

export const createRewardTxBodywithFee = async (
	inputs: Array<TxBodyInput>,
	outputs: Array<PendingReward>,
	outputSum: number,
	protocolParameters: ProtocolParametersResponse
): Promise<RewardTxBodyDetails | null> => {
	const newTxBodyDetails: RewardTxBodyDetails = initRewardTxBodyDetails(inputs, outputSum, '0', outputs);

	let fees = await calculateRewardFeesAsync(newTxBodyDetails, protocolParameters);
	if (isNull(fees)) return null;

	newTxBodyDetails.fee = fees!;

	return newTxBodyDetails;
};

export const createRewardTxBodyAsync = async (
	txBodyDetails: RewardTxBodyDetails,
	protocolParameters: ProtocolParametersResponse
): Promise<{ txHash: CardanoWasm.TransactionHash; txBody: CardanoWasm.TransactionBody } | null> => {
	const MAX_NUMBER_OF_RETRIES = 30;
	let retryCount = 0;

	while (retryCount < MAX_NUMBER_OF_RETRIES) {
		try {
			let txBuilder = await setRewardTxBodyDetailsAsync(txBodyDetails, protocolParameters);
			if (txBuilder === null) throw new Error('Error creating transaction builder');
			let ttl = await setTTLAsync();
			txBuilder.set_ttl(CardanoWasm.BigNum.from_str(ttl.toString()));
			txBuilder.add_change_if_needed(SHELLEY_CHANGE_ADDRESS);
			const txBody = txBuilder.build();
			const txHash = CardanoWasm.hash_transaction(txBody);

			return { txHash, txBody };
		} catch (error) {
			const interval = parseInt((5000 * Math.random()).toFixed());
			console.log(
				`error creating transaction body, retrying in ${interval} ms...\nNumber of retries: ${retryCount}`
			);
			console.log(error);
			await setTimeout(3000 + interval);
			retryCount++;
		}
	}
	return null;
};

export const setRewardTxBodyDetailsAsync = async (
	txBodyDetails: RewardTxBodyDetails,
	protocolParameter: any
): Promise<CardanoWasm.TransactionBuilder | null> => {
	const MAX_NUMBER_OF_RETRIES = 30;
	let retryCount = 0;

	while (retryCount < MAX_NUMBER_OF_RETRIES) {
		try {
			let txBuilder = getTransactionBuilder(protocolParameter);

			setTxInputs(txBuilder, txBodyDetails.txInputs);
			setRewardTxOutputs(txBuilder, txBodyDetails.txOutputs);
			return txBuilder;
		} catch (error) {
			const interval = parseInt((1000 * Math.random()).toFixed());
			console.log(
				`error setting transaction body details, retrying in ${interval} ms...\nNumber of retries: ${retryCount}`
			);
			console.log(error);
			await setTimeout(2000 + interval);
			retryCount++;
		}
	}
	return null;
};
