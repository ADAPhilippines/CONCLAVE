import { BlockFrostAPI, BlockfrostServerError } from '@blockfrost/blockfrost-js';
import {
	RewardTxBodyDetails,
	TxBodyInput,
	UTXO,
	AirdropBatch,
	ProtocolParametersResponse,
} from '../types/response-types';
import CardanoWasm, { TransactionBuilder } from '@dcspark/cardano-multiplatform-lib-nodejs';
import { fromHex, toHex } from './string-utils';
import { createRewardTxBodyAsync } from './txBody/txBody-utils';
import { awaitChangeInUTXOAsync, getMaximumSlotAsync, queryAllUTXOsAsync } from './utxo-utils';
import { isNull, isUndefined } from './boolean-utils';
import { blockfrostAPI } from '../config/network.config';
import { privKey, shelleyChangeAddress } from '../config/walletKeys.config';
import { PendingReward } from '../types/helper-types';
import { getBatchesPerWorker } from './txBody/txInput-utils';
import { setTimeout } from 'timers/promises';
import AirdropTransactionStatus from '../enums/airdrop-transaction-status';

export const setTTLAsync = async (): Promise<number> => {
	const latestBlock = await blockfrostAPI.blocksLatest();
	const currentSlot = latestBlock.slot;

	return currentSlot! + 20 * 20; //after 20 blocks
};

export const signTxBody = (
	txHash: CardanoWasm.TransactionHash,
	txBody: CardanoWasm.TransactionBody,
	signKey: CardanoWasm.PrivateKey
): CardanoWasm.Transaction | null => {
	try {
		const witnesses = CardanoWasm.TransactionWitnessSet.new();
		const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
		const vkeyWitness = CardanoWasm.make_vkey_witness(txHash, signKey);
		vkeyWitnesses.add(vkeyWitness);
		witnesses.set_vkeys(vkeyWitnesses);

		const transaction = createTxBody(txBody, witnesses);

		return transaction;
	} catch (error) {
		console.log('Error Signing Transaction body ' + error);
		return null;
	}
};

export const createTxBody = (
	txBody: CardanoWasm.TransactionBody,
	witnesses: CardanoWasm.TransactionWitnessSet
): CardanoWasm.Transaction | null => {
	try {
		const transaction = CardanoWasm.Transaction.new(txBody, witnesses);
		return transaction;
	} catch (error) {
		console.log('Error Creating Transaction body ' + error);
		return null;
	}
};

export const submitTransactionAsync = async (
	blockfrostAPI: BlockFrostAPI,
	transaction: CardanoWasm.Transaction,
	txHashString: string
): Promise<{ status: number; message: string; txHashString: string }> => {
	const MAX_NUMBER_OF_RETRIES = 30;
	let retryCount = 0;

	while (retryCount <= MAX_NUMBER_OF_RETRIES) {
		try {
			await blockfrostAPI.txSubmit(transaction.to_bytes());
			console.log('Transaction submitted successfully ' + txHashString);
			return {
				status: AirdropTransactionStatus.Success,
				message: 'Successfully submitted!',
				txHashString,
			};
		} catch (error) {
			const interval = parseInt((5000 * Math.random()).toFixed());
			console.log(`error submitting, retrying in ${interval} ms...\nNumber of retries: ${retryCount}`);
			console.log(error);
			await setTimeout(interval);
			retryCount++;
		}
	}

	return {
		status: AirdropTransactionStatus.Failed,
		message: 'Maximum number of retries reached',
		txHashString,
	};
};

export const createAndSignRewardTxAsync = async (
	txBodyDetails: RewardTxBodyDetails,
	protocolParameter: any
): Promise<{
	transaction: CardanoWasm.Transaction;
	txHash: CardanoWasm.TransactionHash;
} | null> => {
	let txBodyResult = await createRewardTxBodyAsync(txBodyDetails, protocolParameter);
	if (txBodyResult == null) return null;

	let txSigned = signTxBody(txBodyResult.txHash, txBodyResult.txBody, privKey);
	if (txSigned == null) return null;

	return { transaction: txSigned, txHash: txBodyResult.txHash };
};

export const transactionConfirmation = async (
	blockfrostAPI: BlockFrostAPI,
	txHashString: string
): Promise<{ status: number; message: string; txHashString: string }> => {
	const MAX_NUMBER_OF_RETRIES = 30;
	let retryCount = 0;
	let maxSlot = await getMaximumSlotAsync(blockfrostAPI);
	if (maxSlot == 0) {
		return {
			status: AirdropTransactionStatus.Failed,
			message: 'Could not get current slot',
			txHashString,
		};
	}

	while (retryCount <= MAX_NUMBER_OF_RETRIES) {
		try {
			let latestBlock = await blockfrostAPI.blocksLatest();

			if (!isNull(latestBlock.slot)) {
				if (
					((400 - (maxSlot - latestBlock.slot!)) / 400) * 100 <= 100 &&
					((400 - (maxSlot - latestBlock.slot!)) / 400) * 100 >= 0
				) {
					console.log(
						'Waiting for confirmation for transaction ' +
							txHashString +
							' ' +
							'(' +
							(((400 - (maxSlot - latestBlock.slot!)) / 400) * 100).toFixed(2) +
							'%' +
							')'
					);
				}

				let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
				let commonHash = utxos.find(u => u.tx_hash === txHashString);

				if (isUndefined(commonHash)) {
					console.log('Failure: Transaction not found in UTXO set');
					return {
						status: AirdropTransactionStatus.Failed,
						message: 'Confirmation failed',
						txHashString,
					};
				}
				if (latestBlock.slot! >= maxSlot) {
					console.log('Transaction Confirmed for ' + txHashString);
					return {
						status: AirdropTransactionStatus.Success,
						message: 'Successfully confirmed transaction!',
						txHashString,
					};
				}
				const interval = parseInt((25000 * Math.random()).toFixed());
				await setTimeout(35000 + interval);
			}
		} catch (error) {
			const interval = parseInt((3000 * Math.random()).toFixed());
			console.log(
				`error in confirmation, retrying in ${5000 + interval} ms...\nNumber of retries: ${retryCount}`
			);
			console.log(error);
			await setTimeout(interval + 5000);
			retryCount++;
		}
	}

	return {
		status: AirdropTransactionStatus.Failed,
		message: 'Confirmation failed',
		txHashString,
	};
};

// export const airdropTransaction = async () => {
// 	await displayUTXOs();

// 	let InputOutputBatches: Array<WorkerBatch> = await getBatchesPerWorker();

// 	InputOutputBatches.splice(0, 10).forEach(async (batch, index) => {
// 		const worker = new Worker('./worker.js');

// 		worker.postMessage({ batch: batch, index: index });
// 	});
// };

export const displayUTXOs = async (utxos: UTXO) => {
	console.log('Displaying All Available utxos');
	let displayUTXO: Array<displayUTXO> = [];

	utxos.forEach(utxo => {
		let assetArray: Array<string> = [];
		utxo.amount.forEach(asset => {
			assetArray.push(asset.quantity + ' ' + asset.unit);
		});

		displayUTXO.push({
			txHash: utxo.tx_hash,
			outputIndex: utxo.output_index.toString(),
			assets: assetArray.join(' + '),
		});
	});

	console.table(displayUTXO);
	console.log(' ');
	console.log(' ');
};

type displayUTXO = {
	txHash: string;
	outputIndex: string;
	assets: string;
};
