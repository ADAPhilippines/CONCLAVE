import { AirdropBatch, AirdropWorkerParameter, ProtocolParametersResponse } from './types/response-types';
import { updateRewardListStatusAsync } from './utils/reward-utils';
import { coinSelectionAsync } from './utils/coin-utils';
import { isNull } from './utils/boolean-utils';
import { getInputAssetUTXOSum, getOutputConclaveSum, getOutputLovelaceSum } from './utils/sum-utils';
import { policyStr } from './config/walletKeys.config';
import { createAndSignRewardTxAsync, submitTransactionAsync, transactionConfirmation } from './utils/transaction-utils';
import AirdropTransactionStatus from './enums/airdrop-transaction-status';
import { parentPort } from 'worker_threads';
import { toHex } from './utils/string-utils';
import { blockfrostAPI } from './config/network.config';
import { awaitChangeInUTXOAsync } from './utils/utxo-utils';

const { v1: uuidv1 } = require('uuid');

parentPort!.on('message', async (workerparameter: AirdropWorkerParameter) => {
	let workerId = uuidv1().substring(0, 5);

	let txInputOutputs = await coinSelectionAsync(
		workerparameter.batch.txInputs,
		workerparameter.batch.txOutputs,
		workerId,
		workerparameter.protocolParameter
	);

	if (isNull(txInputOutputs)) {
		return parentPort!.postMessage({
			status: AirdropTransactionStatus.Failed,
			txHashString: null,
			batch: workerparameter.batch,
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
			getInputAssetUTXOSum(txInputOutputs!.txInputs, policyStr) +
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
			txHashString: null,
			batch: workerparameter.batch,
		});
	}

	let txHashString = toHex(transaction.txHash.to_bytes());
	let MAX_NUMBER_OF_RETRIES = 40;
	let retryCount = 0;
	let submitResult: { status: number; message: string; txHashString: string } | null = null;
	let updateResult: { status: number; message: string; txHashString: string } | null = null;

	while (retryCount < MAX_NUMBER_OF_RETRIES) {
		submitResult = await submitTransactionAsync(blockfrostAPI, transaction!.transaction, txHashString);
		if (submitResult.status != AirdropTransactionStatus.Success) {
			retryCount++;
			continue;
		}

		updateResult = await awaitChangeInUTXOAsync(blockfrostAPI, txHashString);
		if (updateResult.status != AirdropTransactionStatus.Success) {
			retryCount++;
			continue;
		}
		break;
	}

	if (submitResult!.status != AirdropTransactionStatus.Success) {
		return parentPort!.postMessage({
			...submitResult,
			batch: workerparameter.batch,
			txHashString: txHashString,
		});
	}
	if (updateResult!.status != AirdropTransactionStatus.Success) {
		return parentPort!.postMessage({
			...updateResult,
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
	// console.log('exiting worker ' + workerId);
	// parentPort!.postMessage({
	// 	status: AirdropTransactionStatus.Success,
	// 	message: 'confirmation completed',
	// 	batch: workerparameter.batch,
	// 	txHashString: '',
	// });
});
