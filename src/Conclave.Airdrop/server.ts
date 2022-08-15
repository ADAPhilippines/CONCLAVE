import { divideUTXOsAsync } from './utils/manageUTXOs/divideUTXO-utils';
import { TxBodyInput, AirdropBatch, ProtocolParametersResponse } from './types/response-types';
import { displayUTXOs, getAllUTXOsAsync, queryAllUTXOsAsync } from './utils/utxo-utils';
import { getLatestProtocolParametersAsync } from './config/network.config';
import { PendingReward } from './types/helper-types';
import { isEmpty, isNull } from './utils/boolean-utils';
import { getAllPendingEligibleRewardsAsync } from './utils/reward-utils';
import { setTimeout } from 'timers/promises';
import ConclaveAirdropper from './models/ConclaveAirdropper';
import { POLICY_STRING, SHELLEY_CHANGE_ADDRESS } from './config/walletKeys.config';
import AirdropWorker from './models/AirdropWorker';
import { getTotalQuantity, getTotalRewardQuantity, lovelaceInputSum, lovelaceOutputSum } from './utils/sum-utils';
import { generateWorkerBatchesWithThreshold } from './utils/worker-utils';
import { dummyDataOutput, dummyInProgress } from './utils/txBody-utils';

const main = async () => {
	while (true) {
		let { newPendingRewards, inProgressPendingRewards } = await getAllPendingEligibleRewardsAsync(); // InProgress included
		// let newPendingRewards: Array<PendingReward> = dummyDataOutput(); // InProgress included
		// let inProgressPendingRewards: Array<PendingReward> = []; // InProgress included

		console.log('PENDING REWARDS COUNT: ' + newPendingRewards.length);
		console.log('IN PROGRESS REWARDS COUNT: ' + inProgressPendingRewards.length);

		if (!isEmpty(newPendingRewards) || !isEmpty(inProgressPendingRewards)) {
			// Start airdropper
			await startAirdropper(newPendingRewards, []);
		}
		const AIRDROPPER_INTERVAL = 1000 * 60 * 60 * 6;
		console.log(`Airdropper will rerun in ${AIRDROPPER_INTERVAL / 24.0} hours `);
		await setTimeout(AIRDROPPER_INTERVAL); // Check every 6 hourse
	}
};

const startAirdropper = async (newPendingRewards: PendingReward[], inProgressPendingRewards: PendingReward[]): Promise<void> => {
	let protocolParameter = await getLatestProtocolParametersAsync();

	// Divide UTXOs
	await divideUTXOsAsync(protocolParameter);

	// Display UTXOs
	let utxos = await queryAllUTXOsAsync(SHELLEY_CHANGE_ADDRESS.to_bech32());
	await displayUTXOs(utxos!);

	let utxosInWallet: Array<TxBodyInput> = await getAllUTXOsAsync(SHELLEY_CHANGE_ADDRESS.to_bech32());
	console.log('UTXOs in wallet: ' + utxosInWallet.length);
	// Divide pending rewards into batches
	let airdropBatches: Array<AirdropBatch> = await generateWorkerBatchesWithThreshold(
		utxosInWallet,
		newPendingRewards,
		inProgressPendingRewards,
		20 //batch size
	);

	//initialize workers
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
	let airdropWorker: AirdropWorker | null = null;

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

// const displayPendingRewards = (pendingRewards: PendingReward[]) => {
// 	pendingRewards.forEach(pendingReward => {
// 		console.table(
// 			pendingReward.rewards.forEach(reward => {
// 				console.table(reward);
// 			})
// 		);
// 	});
// };

// const displayInputOutputTotals = (inputOutputBatches: Array<AirdropBatch>) => {
// 	inputOutputBatches.forEach((e, index) => {
// 		console.log('BATCH #' + index);
// 		console.log('INPUT LOVELACE SUM: ' + getTotalQuantity('lovelace', e.txInputs));
// 		console.log('INPUT CONCLAVE SUM: ' + getTotalQuantity(POLICY_STRING!, e.txInputs));
// 		console.log('OUTPUT LOVELACE SUM: ' + getTotalRewardQuantity(true, e.txOutputs));

// 		console.log('OUTPUT CONCLAVE SUM: ' + getTotalRewardQuantity(false, e.txOutputs));
// 		console.log('INPUT UTXO COUNT: ' + e.txInputs.length);
// 		console.log('OUTPUT ACCOUNT COUNT: ' + e.txOutputs.length);
// 	});
// };

main();
