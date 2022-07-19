import { parentPort } from 'worker_threads';
import { WorkerBatch } from './types/response-types';
import { updateRewardListStatusAsync } from './utils/reward-utils';
import { coinSelectionAsync } from './utils/coin-utils';
import { isNull } from './utils/boolean-utils';
import { getInputAssetUTXOSum, getOutputConclaveSum, getOutputLovelaceSum } from './utils/sum-utils';
import { policyStr } from './config/walletKeys.config';
import { createAndSignRewardTxAsync, submitTransactionAsync, transactionConfirmation } from './utils/transaction-utils';
import { blockfrostAPI } from './config/network.config';
import { toHex } from './utils/string-utils';
import { awaitChangeInUTXOAsync } from './utils/utxo-utils';

parentPort!.on(
	'message',
	async (data: { batch: Int32Array; currentIndex: number; worker: number; workerbatches: Array<WorkerBatch> }) => {
		if (data.currentIndex >= data.workerbatches.length)
			return parentPort!.postMessage({
				status: 'exit',
				txHashString: '',
				currentIndex: data.currentIndex,
			});

		// Check if there are pending inputs
		// while (data.currentIndex < data.batch.length) {
		// 	if (Atomics.load(data.batch, data.currentIndex) > 0) break;
		// 	data.currentIndex++;

		// 	if (data.currentIndex >= data.batch.length)
		// 		return parentPort!.postMessage({
		// 			currentIndex: data.currentIndex,
		// 			status: 'exit',
		// 			txHashString: '',
		// 		});
		// }

		var dataIndex = getDataIndex(data);

		// Change
		Atomics.exchange(data.batch, dataIndex, 0);

		let txInputOutputs = await coinSelectionAsync(
			data.workerbatches[dataIndex].txInputs,
			data.workerbatches[dataIndex].txOutputs,
			data.worker
		);
		if (isNull(txInputOutputs)) {
			parentPort!.postMessage({
				status: 'failed',
				txHashString: '',
				currentIndex: dataIndex,
			});
		}

		txInputOutputs?.txInputs.forEach((e, i) => {
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

		console.log('WORKER# ' + data.worker + ' ');
		console.log(
			'<========Details for WORKER #' +
				data.worker +
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
				'<========End of Details for WORKER#' +
				data.worker +
				' ========>'
		);
		console.log();

		let transaction = await createAndSignRewardTxAsync(txInputOutputs!);
		if (transaction == null) {
			parentPort!.postMessage({
				status: 'failed',
				txHashString: '',
				currentIndex: dataIndex,
			});
		}
		let txHashString = toHex(transaction!.txHash.to_bytes());
		let submitResult = null;
		let updateResult = null;
		let MAX_NUMBER_OF_RETRIES = 40;
		let retryCount = 0;

		while (
			(submitResult == null && updateResult == null) ||
			(submitResult!.status != 'submitted' &&
				updateResult!.status != 'updated' &&
				retryCount < MAX_NUMBER_OF_RETRIES)
		) {
			submitResult = await submitTransactionAsync(blockfrostAPI, transaction!.transaction, txHashString);
			updateResult = await awaitChangeInUTXOAsync(blockfrostAPI, txHashString);
		}

		if (submitResult!.status != 'submitted') {
			parentPort!.postMessage({
				...submitResult,
				currentIndex: dataIndex,
			});
		}
		if (updateResult!.status != 'updated') {
			parentPort!.postMessage({
				...updateResult,
				currentIndex: dataIndex,
			});
		}

		let confirmationResult = await transactionConfirmation(blockfrostAPI, txHashString);
		parentPort!.postMessage({
			...confirmationResult,
			currentIndex: dataIndex,
		});
	}
);

const getDataIndex = (data: {
	batch: Int32Array;
	currentIndex: number;
	worker: number;
	workerbatches: Array<WorkerBatch>;
}): number => {
	for (let i = data.currentIndex; i < data.batch.length; i++) if (Atomics.load(data.batch, i) > 0) return i;
	return -1;
};
