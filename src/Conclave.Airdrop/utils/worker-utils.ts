import { POLICY_STRING } from '../config/walletKeys.config';
import { PendingReward } from '../types/helper-types';
import { AirdropBatch, TxBodyInput } from '../types/response-types';
import { isEmpty, isNull, isZero } from './boolean-utils';
import { appendToList, filterUTXOsInWallet } from './list-utils';
import { conclaveInputSum, conclaveOutputSum, lovelaceInputSum } from './sum-utils';
import { initAirdropBatch } from './type-utils';

export const getOutputWorkerBatchWithBatchSize = async (
	pendingRewards: Array<PendingReward> = [],
	batchSize: number
): Promise<Array<Array<PendingReward>>> => {
	let txOutputBatches: Array<Array<PendingReward>> = [];

	while (pendingRewards.length > 0) {
		txOutputBatches.push(pendingRewards.splice(0, batchSize));
	}
	return txOutputBatches;
};

const getConclaveFirstWithThreshold = (
	utxosInWallet: Array<TxBodyInput>,
	minimumLovelace: number = 248_000_000,
	minimumConclave: number = 10_000_000
) => {
	return (
		utxosInWallet!.find(
			e => e.asset.find(a => a.unit == POLICY_STRING) && parseInt(e.asset.find(a => a.unit == POLICY_STRING)!.quantity) >= minimumConclave
		) ??
		utxosInWallet!.find(e => e.asset.find(a => a.unit == POLICY_STRING) && parseInt(e.asset.find(a => a.unit == POLICY_STRING)!.quantity) >= 0) ??
		utxosInWallet!.find(e => parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) <= minimumLovelace) ??
		utxosInWallet!.find(e => parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) >= 0)
	);
};

const getLovelaceFirstWithThreshold = (
	utxosInWallet: Array<TxBodyInput>,
	minimumLovelace: number = 248_000_000,
	minimumConclave: number = 10_000_000
) => {
	return (
		utxosInWallet!.find(
			e =>
				e.asset.length === 1 &&
				e.asset.find(a => a.unit != POLICY_STRING) &&
				parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) >= minimumLovelace
		) ??
		utxosInWallet!.find(
			e =>
				e.asset.length === 1 &&
				e.asset.find(a => a.unit != POLICY_STRING) &&
				parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) >= parseInt((minimumLovelace / 2).toFixed())
		) ??
		utxosInWallet!.find(
			e => e.asset.length === 1 && e.asset.find(a => a.unit != POLICY_STRING) && parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) > 0
		) ??
		utxosInWallet!.find(
			e => e.asset.find(a => a.unit == POLICY_STRING) && parseInt(e.asset.find(a => a.unit == POLICY_STRING)!.quantity) <= minimumConclave
		) ??
		utxosInWallet!.find(e => parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) >= 0)
	);
};

function addSmallConclaveUTXOAvailableWithThreshold(
	utxosInWallet: Array<TxBodyInput>,
	inputsBatch: Array<TxBodyInput>,
	thresHold: number = 10_000_000
) {
	let smallUTXO =
		utxosInWallet!.find(
			e => e.asset.find(a => a.unit == POLICY_STRING) && parseInt(e.asset.find(a => a.unit == POLICY_STRING)!.quantity) < 1_000_000
		) ??
		utxosInWallet!.find(
			e => e.asset.find(a => a.unit == POLICY_STRING) && parseInt(e.asset.find(a => a.unit == POLICY_STRING)!.quantity) < thresHold
		);
	if (smallUTXO) {
		appendToList(inputsBatch, smallUTXO);
		filterUTXOsInWallet(utxosInWallet!, smallUTXO!);
	}
}

function addSmallLovelaceUTXOAvailableWithThreshold(
	utxosInWallet: Array<TxBodyInput>,
	inputsBatch: Array<TxBodyInput>,
	thresHold: number = 100_000_000
) {
	let smallUTXO = utxosInWallet!.find(e => parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) <= thresHold);

	if (smallUTXO) {
		appendToList(inputsBatch, smallUTXO);
		filterUTXOsInWallet(utxosInWallet!, smallUTXO!);
	}
}

function addAdditionalLovelaceUTXOAvailableWithThreshold(
	utxosInWallet: Array<TxBodyInput>,
	inputsBatch: Array<TxBodyInput>,
	minimumLovelace: number = 248_000_000
) {
	let additionalUTXO =
		utxosInWallet!.find(
			e =>
				e.asset.length === 1 &&
				e.asset.find(a => a.unit != POLICY_STRING) &&
				parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) <= parseInt((minimumLovelace / 2).toFixed())
		) ??
		utxosInWallet!.find(
			e =>
				e.asset.length === 1 &&
				e.asset.find(a => a.unit != POLICY_STRING) &&
				parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) <= minimumLovelace
		) ??
		utxosInWallet!.find(
			e => e.asset.length === 1 && e.asset.find(a => a.unit != POLICY_STRING) && parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) > 0
		) ??
		utxosInWallet!.find(e => parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) <= parseInt((minimumLovelace / 2).toFixed())) ??
		utxosInWallet!.find(e => parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) <= minimumLovelace) ??
		utxosInWallet!.find(e => parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) > 0);

	if (additionalUTXO) {
		appendToList(inputsBatch, additionalUTXO);
		filterUTXOsInWallet(utxosInWallet!, additionalUTXO!);
	}
}

function addConclaveAvailableWithThreshold(
	utxosInWallet: Array<TxBodyInput>,
	inputsBatch: Array<TxBodyInput>,
	minimumLovelace: number = 248_000_000,
	minimumConclave: number = 10_000_000
) {
	let conclaveUTXO = getConclaveFirstWithThreshold(utxosInWallet, minimumLovelace, minimumConclave);
	if (conclaveUTXO) {
		appendToList(inputsBatch, conclaveUTXO);
		filterUTXOsInWallet(utxosInWallet!, conclaveUTXO!);
	}
}

function addLovelaceAvailableWithThreshold(
	utxosInWallet: Array<TxBodyInput>,
	inputsBatch: Array<TxBodyInput>,
	minimumLovelace: number = 248_000_000,
	minimumConclave: number = 10_000_000
) {
	let lovelaceUTXO = getLovelaceFirstWithThreshold(utxosInWallet, minimumLovelace, minimumConclave);
	if (lovelaceUTXO) {
		appendToList(inputsBatch, lovelaceUTXO);
		filterUTXOsInWallet(utxosInWallet!, lovelaceUTXO);
	}
}

export const generateWorkerBatchesWithThreshold = async (
	utxosInWallet: Array<TxBodyInput> | null = null,
	newPendingRewards: Array<PendingReward> | null = null,
	inProgressPendingRewards: Array<PendingReward> | null = null,
	batchSize: number = 300,
	MinLovelaceAmountPerBatch: number = 450_000_000,
	MinConclaveAmountPerBatch: number = 10_000_000
): Promise<Array<AirdropBatch>> => {
	let outputBatches = await getOutputWorkerBatchWithBatchSize(newPendingRewards ?? [], batchSize);
	let inputOutputBatch: Array<AirdropBatch> = [];
	if (isNull(utxosInWallet) || isEmpty(utxosInWallet!)) return inputOutputBatch;

	outputBatches!.forEach(element => {
		if (isZero(lovelaceInputSum(utxosInWallet!))) return;

		let inputsBatch: Array<TxBodyInput> = [];
		if (!isZero(conclaveOutputSum(element))) {
			addConclaveAvailableWithThreshold(utxosInWallet!, inputsBatch, MinLovelaceAmountPerBatch, MinConclaveAmountPerBatch);

			while (conclaveInputSum(inputsBatch) < 10_000_000 && conclaveInputSum(utxosInWallet) > 0) {
				addConclaveAvailableWithThreshold(utxosInWallet!, inputsBatch, MinLovelaceAmountPerBatch, MinConclaveAmountPerBatch);
			}

			while (lovelaceInputSum(inputsBatch) < MinLovelaceAmountPerBatch && lovelaceInputSum(utxosInWallet!) > 0) {
				addAdditionalLovelaceUTXOAvailableWithThreshold(utxosInWallet!, inputsBatch, MinLovelaceAmountPerBatch);
			}

			addSmallConclaveUTXOAvailableWithThreshold(utxosInWallet!, inputsBatch);
		} else {
			addLovelaceAvailableWithThreshold(utxosInWallet!, inputsBatch);

			while (lovelaceInputSum(inputsBatch) < MinLovelaceAmountPerBatch && lovelaceInputSum(utxosInWallet!) > 0) {
				addAdditionalLovelaceUTXOAvailableWithThreshold(utxosInWallet!, inputsBatch, MinLovelaceAmountPerBatch);
			}

			addSmallLovelaceUTXOAvailableWithThreshold(utxosInWallet!, inputsBatch);
		}

		let workerBatch: AirdropBatch = initAirdropBatch(inputsBatch, element);
		appendToList(inputOutputBatch, workerBatch);
	});

	// Add InProgress Batches
	for (let inProgressPendingReward of inProgressPendingRewards!) {
		let workerBatch: AirdropBatch | undefined = inputOutputBatch.find(i => i.txHash === inProgressPendingReward.rewards[0].TransactionHash);

		if (workerBatch) {
			workerBatch.txOutputs.push(inProgressPendingReward);
		} else {
			workerBatch = initAirdropBatch([], [inProgressPendingReward]);
			workerBatch.isProcessing = true;
			workerBatch.txHash = workerBatch.txHash ?? inProgressPendingReward.rewards[0].TransactionHash;
			appendToList(inputOutputBatch, workerBatch);
		}
	}

	return inputOutputBatch;
};
function uuidv1() {
	throw new Error('Function not implemented.');
}

export class ConsoleWithWorkerId {
	private readonly workerId: string;

	constructor(workerId: string) {
		this.workerId = workerId;
	}

	public log(message: string = '') {
		if (message !== '') console.log(`WORKER ${this.workerId}: ${message}`);
	}
}
