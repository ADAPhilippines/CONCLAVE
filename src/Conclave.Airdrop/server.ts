import { divideUTXOsAsync } from './utils/manageUTXOs/divideUTXO-utils';
import { TxBodyInput, AirdropBatch, ProtocolParametersResponse } from './types/response-types';
import { getBatchesPerWorker } from './utils/txBody/txInput-utils';
import { queryAllUTXOsAsync } from './utils/utxo-utils';
import { blockfrostAPI, getLatestProtocolParametersAsync } from './config/network.config';
import { getAllUTXOsAsync } from './utils/airdrop-utils';
import { dummyDataOutput } from './utils/txBody/txOutput-utils';
import { PendingReward } from './types/helper-types';
import { isEmpty, isNull } from './utils/boolean-utils';
import {
	getAllPendingEligibleRewardsAsync,
	getAllPendingRewardsAsync,
	getAllPendingTransactionsAsync,
} from './utils/reward-utils';
import { setTimeout } from 'timers/promises';
import ConclaveAirdropper from './models/ConclaveAirdropper';
import { POLICY_STRING, SHELLEY_CHANGE_ADDRESS } from './config/walletKeys.config';

const main = async () => {
	// initWorkers (i.e workerPool = initWorkerPool())
	const PENDING_REWARD_TRESHOLD = 10; // move to config

	while (true) {
		// let pendingRewards: Array<PendingReward> = await getAllPendingEligibleRewardsAsync();
		let pendingRewards: Array<PendingReward> = dummyDataOutput();
		// let inProgressTransactionHashes: string[] = await getAllPendingTransactionsAsync();

		if (pendingRewards.length >= PENDING_REWARD_TRESHOLD /* || inProgressTransactionHashes.length > 0 */) {
			await startAirdropper(pendingRewards, []);
		}

		const AIRDROPPER_INTERVAL = 1000 * 60 * 60 * 5;
		console.log(`Airdropper will rerun in ${AIRDROPPER_INTERVAL / 24.0} hours `);
		await setTimeout(AIRDROPPER_INTERVAL); // Check every 6 hourse
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

const startAirdropper = async (
	pendingRewards: PendingReward[],
	inProgressTransactionHashes: string[]
): Promise<void> => {
	let protocolParameter = await getLatestProtocolParametersAsync(blockfrostAPI);
	// Divide UTXOs
	// let utxos = await queryAllUTXOsAsync(blockfrostAPI, SHELLEY_CHANGE_ADDRESS.to_bech32());
	// await divideUTXOsAsync(utxos, 500_000_000, protocolParameter);

	let utxosInWallet: Array<TxBodyInput> = await getAllUTXOsAsync(SHELLEY_CHANGE_ADDRESS.to_bech32());

	// Divide pending rewards into batches
	let airdropBatches: Array<AirdropBatch> = await getBatchesPerWorker(utxosInWallet, pendingRewards);
	// displayInputOutputTotals(airdropBatches);
	const conclaveAirdropper = new ConclaveAirdropper(10);

	let index = 0;
	for (let airdropBatch of airdropBatches) {
		airdropBatch.index = ++index;
		await executeAirdropWorkerAsync(conclaveAirdropper, airdropBatch, protocolParameter);
	}
};

// helpers
const executeAirdropWorkerAsync = async (
	conclaveAirdropper: ConclaveAirdropper,
	batch: AirdropBatch,
	protocolParameter: ProtocolParametersResponse
): Promise<void> => {
	let airdropWorker = null;

	while (airdropWorker === null) {
		airdropWorker = conclaveAirdropper.getFirstAvailableWorker();

		if (isNull(airdropWorker)) {
			console.log('waiting available worker');
			await setTimeout(1000 * 60 * 2); // wait 2 minutes
			continue;
		}

		airdropWorker!.execute(batch, protocolParameter);
		break;
	}
};

const displayPendingRewards = (pendingRewards: PendingReward[]) => {
	pendingRewards.forEach(pendingReward => {
		console.table(
			pendingReward.rewards.forEach(reward => {
				console.table(reward);
			})
		);
	});
};

const displayInputOutputTotals = (inputOutputBatches: Array<AirdropBatch>) => {
	inputOutputBatches.forEach((e, index) => {
		console.log('BATCH #' + index);
		console.log('INPUT LOVELACE SUM: ' + getTotalQuantity('lovelace', e.txInputs));
		console.log('INPUT CONCLAVE SUM: ' + getTotalQuantity(POLICY_STRING!, e.txInputs));
		console.log('OUTPUT LOVELACE SUM: ' + getTotalRewardQuantity(true, e.txOutputs));

		console.log('OUTPUT CONCLAVE SUM: ' + getTotalRewardQuantity(false, e.txOutputs));
		console.log('INPUT UTXO COUNT: ' + e.txInputs.length);
		console.log('OUTPUT ACCOUNT COUNT: ' + e.txOutputs.length);
	});
};

main();

// pendingReward -> [ 100, 1000 ], [10, 1000], [500, 1000]
// UTXO - 10000 ADA 1b CNLV

// batch1 = [100 ADA, 1000 CNLV]
// batch2 = [10 ADA, 1000 CNLV]
// batch3 = [500 ADA, 1000 CNLV]

// DIVIDE UTXO FUNCTION
// UTXO 1 = [100 ADA, 1000 CNLV] -> batch1
// UTXO 2 = [10 ADA< 1000 CNLV] -> batch2
// UTXO 3 = [500 ADA, 1000 CNLV] -> batch3
// UTXO 4 = 9000 ADA 988m CNLV -------> waiting for next batches

// input
// -----> 1 input -> outputs -----> 200 outputs -> 15-50 -> 150  ---> bigger fee ? -> 250 250 250 250 250

// UTXO -> 1000
// 4 -> 250 (variable) ADA UTXOS ->

// startAirdrop
// batchWithoutInput -> output[100 ADA, 500, 1000 ADA]
// divideUtxo -> utxos -> utxo 100 ADA, 500 ADA -> cost effective -> possible sobrang laki ng fee -> 100 -> 500 -> 9400 --> 9400 -> <- 1000

// 9400 + 1000 --------> 100 ADA, 500 ADA, 1000 ADA -> change
