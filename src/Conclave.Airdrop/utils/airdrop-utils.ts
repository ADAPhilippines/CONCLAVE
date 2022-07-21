import { blockfrostAPI } from '../config/network.config';
import { policyStr, shelleyChangeAddress } from '../config/walletKeys.config';
import { Reward } from '../types/database-types';
import { PendingReward } from '../types/helper-types';
import { CardanoAssetResponse, TxBodyInput } from '../types/response-types';
import { isEmpty, isNull, isUndefined } from './boolean-utils';
import { coinSelectionAsync } from './coin-utils';
import { toHex } from './string-utils';
import {
	conclaveOutputSum,
	getInputAssetUTXOSum,
	getOutputConclaveSum,
	getOutputLovelaceSum,
	lovelaceOutputSum,
} from './sum-utils';
import { createAndSignRewardTxAsync, submitTransactionAsync } from './transaction-utils';
import { queryAllUTXOsAsync } from './utxo-utils';
import { parentPort } from 'worker_threads';
import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';
import { BlockFrostAPI, BlockfrostServerError, Responses } from '@blockfrost/blockfrost-js';

export const getRawUTXOAssetAsync = async (unit: string = 'lovelace'): Promise<Array<TxBodyInput>> => {
	let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
	let txBodyInputs: Array<TxBodyInput> = [];
	utxos = utxos.filter(
		utxo =>
			(unit == 'lovelace' ? utxo.amount.length == 1 : utxo.amount.length >= 1) &&
			utxo.amount.find(asset => asset.unit == unit)
	);

	utxos.forEach(utxo => {
		let assetArray: Array<CardanoAssetResponse> = [];
		utxo.amount.forEach(asset => {
			const cardanoAsset: CardanoAssetResponse = {
				unit: asset.unit,
				quantity: asset.quantity,
			};

			assetArray.push(cardanoAsset);
		});

		const utxoInput: TxBodyInput = {
			txHash: utxo.tx_hash,
			outputIndex: utxo.output_index.toString(),
			asset: assetArray,
		};

		txBodyInputs.push(utxoInput);
	});

	return txBodyInputs;
};

export const getAllUTXOsAsync = async (walletAddress: string): Promise<Array<TxBodyInput>> => {
	let utxos = await queryAllUTXOsAsync(blockfrostAPI, walletAddress);
	let txBodyInputs: Array<TxBodyInput> = [];

	utxos.forEach(utxo => {
		let assetArray: Array<CardanoAssetResponse> = [];
		utxo.amount.forEach(asset => {
			const cardanoAsset: CardanoAssetResponse = {
				unit: asset.unit,
				quantity: asset.quantity,
			};

			assetArray.push(cardanoAsset);
		});

		const utxoInput: TxBodyInput = {
			txHash: utxo.tx_hash,
			outputIndex: utxo.output_index.toString(),
			asset: assetArray,
		};

		txBodyInputs.push(utxoInput);
	});

	return txBodyInputs;
};

// console.log('WORKER# ' + worker + " " + "<========Creating TxBody for Worker #" + index + " ========>");
//     let txInputOutputs = await coinSelectionAsync(txInputBatch, txOutputBatch, worker);
//     if (isNull(txInputOutputs)) {
//         return {currentIndex: index, status: "invalid"};
//     };

//     txInputOutputs?.txInputs.forEach((e, i) => {
//         console.log('Txinput #' + i + " " + e.txHash + ' ' + e.asset.find(f => f.unit == "lovelace")!.quantity + " " + e.asset.find(f => f.unit == "lovelace")!.unit + " " + e.asset.find(f => f.unit != "lovelace")?.quantity);
//     });

//     console.log('WORKER# ' + worker + " ");
//     console.log("<========Details for WORKER #" + worker + " ========> \n" +
//         'TxInputLovelace sum: ' + getInputAssetUTXOSum(txInputOutputs!.txInputs) + "\n" +
//         'TxOutputLovelace sum: ' + getOutputLovelaceSum(txInputOutputs!.txOutputs) + "\n" +
//         'TxInputConclave sum: ' + getInputAssetUTXOSum(txInputOutputs!.txInputs, policyStr) + "\n" +
//         'TxOutputConclave sum: ' + getOutputConclaveSum(txInputOutputs!.txOutputs) + "\n" +
//         "<========End of Details for WORKER#" + worker + " ========>");
//     console.log();

//     let transaction = await createAndSignRewardTxAsync(txInputOutputs!);
//     if (transaction == null) {
//         return parentPort?.postMessage({currentIndex: index, status: "failed"});
//     };

//     console.log('WORKER# ' + worker + ': Transaction #' + index + " " + toHex(transaction.txHash.to_bytes()) + ' fee ' + transaction.transaction.body().fee().to_str());
