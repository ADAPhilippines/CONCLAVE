import { AirdropBatch, AirdropWorkerParameter, ProtocolParametersResponse } from './types/response-types';
import { updateRewardListStatusAsync } from './utils/reward-utils';
import { coinSelectionAsync } from './utils/coin-utils';
import { isNull, isUndefined } from './utils/boolean-utils';
import { getInputAssetUTXOSum, getOutputConclaveSum, getOutputLovelaceSum } from './utils/sum-utils';
import { createAndSignRewardTxAsync, submitTransactionAsync, transactionConfirmation } from './utils/transaction-utils';
import AirdropTransactionStatus from './enums/airdrop-transaction-status';
import { parentPort } from 'worker_threads';
import { toHex } from './utils/string-utils';
import { blockfrostAPI } from './config/network.config';
import { awaitChangeInUTXOAsync } from './utils/utxo-utils';
import { POLICY_STRING } from './config/walletKeys.config';

const { v1: uuidv1 } = require('uuid');

parentPort!.on('message', async (workerparameter: AirdropWorkerParameter) => {
	let workerId = uuidv1().substring(0, 5);

	// if (!isNull(workerparameter.batch.txHash) && !isUndefined(workerparameter.batch.txHash)) {
	// 	let confirmationResult = await transactionConfirmation(blockfrostAPI, workerparameter.batch.txHash!);
	// 	return parentPort!.postMessage({
	// 		...confirmationResult,
	// 		batch: workerparameter.batch,
	// 		txHashString: workerparameter.batch.txHash!,
	// 	});
	// }

	let txInputOutputs = await coinSelectionAsync(
		workerparameter.batch.txInputs,
		workerparameter.batch.txOutputs,
		workerId,
		workerparameter.protocolParameter
	);

	if (isNull(txInputOutputs)) {
		return parentPort!.postMessage({
			status: AirdropTransactionStatus.Failed,
			batch: workerparameter.batch,
			txHashString: null,
		});
	}

	console.log();
	txInputOutputs!.txInputs.forEach((e, i) => {
		console.log(
			'Txinput #' +
				i +
				' ' +
				e.txHash +
				' ' +
				e.asset.find(f => f.unit == 'lovelace')!.quantity +
				' ' +
				e.asset.find(f => f.unit == 'lovelace')!.unit +
				' ' +
				e.asset.find(f => f.unit != 'lovelace')?.quantity
		);
	});

	console.log(
		'<========Details for Worker#' +
			workerId +
			'\n Currently working on Batch#' +
			workerparameter.batch.index +
			' ========> \n' +
			'TxInputLovelace sum: ' +
			getInputAssetUTXOSum(txInputOutputs!.txInputs) +
			'\n' +
			'TxOutputLovelace sum: ' +
			getOutputLovelaceSum(txInputOutputs!.txOutputs) +
			'\n' +
			'TxInputConclave sum: ' +
			getInputAssetUTXOSum(txInputOutputs!.txInputs, POLICY_STRING) +
			'\n' +
			'TxOutputConclave sum: ' +
			getOutputConclaveSum(txInputOutputs!.txOutputs) +
			'\n' +
			'<========End of Details for Batch#' +
			workerparameter.batch.index +
			' ========>'
	);
	console.log();

	let transaction = await createAndSignRewardTxAsync(txInputOutputs!, workerparameter.protocolParameter);
	if (transaction == null || transaction.txHash == null) {
		console.log('exiting worker ' + workerId);
		return parentPort!.postMessage({
			status: AirdropTransactionStatus.Failed,
			batch: workerparameter.batch,
			txHashString: null,
		});
	}

	let txHashString = toHex(transaction.txHash.to_bytes());

	let submitResult = await submitTransactionAsync(blockfrostAPI, transaction!.transaction, txHashString);
	if (submitResult!.status != AirdropTransactionStatus.Success) {
		return parentPort!.postMessage({
			...submitResult,
			batch: workerparameter.batch,
			txHashString: txHashString,
		});
	}

	let confirmationResult = await transactionConfirmation(blockfrostAPI, txHashString);
	return parentPort!.postMessage({
		...confirmationResult,
		batch: workerparameter.batch,
		txHashString: txHashString,
	});
	console.log('exiting worker ' + workerId);
	// parentPort!.postMessage({
	// 	status: AirdropTransactionStatus.Success,
	// 	message: 'confirmation completed',
	// 	batch: workerparameter.batch,
	// 	txHashString: '',
	// });
});
