import {
	accountKey,
	addressBech32,
	privKey,
	rootKey,
	shelleyChangeAddress,
	utxoPrvKey,
	utxoPubKey,
} from './config/walletKeys.config';
import { divideUTXOsAsync } from './utils/manageUTXOs/divideUTXO-utils';
import { TxBodyInput, WorkerBatch } from './types/response-types';
import { getBatchesPerWorker } from './utils/txBody/txInput-utils';
import { executeWorkers } from './utils/worker-utils';
import { queryAllUTXOsAsync } from './utils/utxo-utils';
import { blockfrostAPI } from './config/network.config';
import { getAllUTXOsAsync } from './utils/airdrop-utils';
import { dummyDataOutput } from './utils/txBody/txOutput-utils';
import { PendingReward } from './types/helper-types';
import { isEmpty, isNull } from './utils/boolean-utils';
import { getAllPendingEligibleRewardsAsync, getAllPendingRewardsAsync } from './utils/reward-utils';
import { setTimeout } from 'timers/promises';

const main = async () => {
	// initWorkers (i.e workerPool = initWorkerPool())

	const PENDING_REWARD_TRESHOLD = 60; // move to config

	while (true) {
		let pendingRewards: Array<PendingReward> = await getAllPendingEligibleRewardsAsync();
		// get inProgressTransactionHashes: string[]

		if (pendingRewards.length >= PENDING_REWARD_TRESHOLD /* || inProgressTransactionHashes.length > 0 */)
			await startAirdropper(pendingRewards /*, inProgressRewards, workerPool */);

		await setTimeout(1000 * 60 * 5); // Check every 5 minutes
	}
};

// move to appropriate modules
const getTotalQuantity = (unit: string, data: TxBodyInput[]) => {
	return data
		.map(input =>
			Number(
				input.asset
					.filter(asset => asset.unit === unit)
					.map(asset => Number(asset.quantity))
					.reduce((acc, next) => acc + next)
			)
		)
		.reduce((acc, next) => acc + next);
};

const getTotalRewardQuantity = (isAda: boolean, data: PendingReward[]) => {
	return data
		.map(out =>
			out.rewards
				.filter(reward => (isAda ? reward.rewardType === 3 : reward.rewardType !== 3))
				.map(reward => Number(reward.rewardAmount))
				.reduce((acc, next) => acc + next)
		)
		.reduce((acc, next) => acc + next);
};

// BATCH #0
// INPUT LOVELACE SUM: 279493194
// INPUT CONCLAVE SUM: 689413782
// OUTPUT LOVELACE SUM: 600000000
// OUTPUT CONCLAVE SUM: 1099
// BATCH #1
// INPUT LOVELACE SUM: 249992996
// INPUT CONCLAVE SUM: 10000000
// OUTPUT LOVELACE SUM: 600000000
// OUTPUT CONCLAVE SUM: 1001

main();

const startAirdropper = async (pendingRewards: PendingReward[] /*, inProgressTransactionHashes: string[] */) => {
	// Divide UTXOs
	let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
	await divideUTXOsAsync(utxos /*, adaTreshold, conclaveTreshold)*/);

	/* 500 rewards -> */
	// Batch 1 - 100 ADA 1m CNLV
	// Batch 2 - 200 ADA 2m CNLV
	// batch ------ 10000 ada 10 batches -> 1000 ada
	// 1000 utxo 1000 reward
	// 1000 ada -> + 50 other small transactions = 5000 ADA -> 1 batch only --

	// output 5000 ADA

	// divide utxo -> input
	// 1 UTXO -> to cover batch 1
	// 1 UTXO - to cover batch 2

	// Fetch UTXOs in Wallet
	let utxosInWallet: Array<TxBodyInput> = await getAllUTXOsAsync(/* wallet address */);

	// Log pending rewards
	displayPendingRewards(pendingRewards);

	// Check if there's rewards to airdrop
	if (isEmpty(pendingRewards) || isNull(pendingRewards))
		return console.log('No eligible rewards as of the moment...');

	// Divide pending rewards into batches
	let inputOutputBatches: Array<WorkerBatch> = await getBatchesPerWorker(utxosInWallet, pendingRewards);

	// Log input and output totals
	displayInputOutputTotals(inputOutputBatches);

	await executeWorkers(inputOutputBatches); // worker, args => while

	// outside -> executeWorker(worker, params);
};

// helpers

const displayPendingRewards = (pendingRewards: PendingReward[]) => {
	pendingRewards.forEach(pendingReward => {
		console.table(
			pendingReward.rewards.forEach(reward => {
				console.table(reward);
			})
		);
	});
};

const displayInputOutputTotals = (inputOutputBatches: WorkerBatch[]) => {
	inputOutputBatches.forEach((e, index) => {
		console.log('BATCH #' + index);
		console.log('INPUT LOVELACE SUM: ' + getTotalQuantity('lovelace', e.txInputs));
		console.log(
			'INPUT CONCLAVE SUM: ' +
				getTotalQuantity(
					'b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca1853616d706c65546f6b656e4a0a',
					e.txInputs
				)
		);
		console.log('OUTPUT LOVELACE SUM: ' + getTotalRewardQuantity(true, e.txOutputs));

		console.log('OUTPUT CONCLAVE SUM: ' + getTotalRewardQuantity(false, e.txOutputs));
		console.log('INPUT UTXO COUNT: ' + e.txInputs.length);
		console.log('OUTPUT ACCOUNT COUNT: ' + e.txOutputs.length);
	});
};
