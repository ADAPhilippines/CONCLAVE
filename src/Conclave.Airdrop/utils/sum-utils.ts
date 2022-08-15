import { POLICY_STRING } from '../config/walletKeys.config';
import { PendingReward } from '../types/helper-types';
import { TxBodyInput } from '../types/response-types';

export const getOutputLovelaceSum = (currentOutputBatch: Array<PendingReward>): number => {
	if (currentOutputBatch === null || currentOutputBatch === undefined) return 0;

	let _partialSum = 0;
	currentOutputBatch.forEach(pendingReward => {
		pendingReward.rewards
			.filter(e => e.RewardType === 3)
			.forEach(lovelaceAmount => {
				_partialSum += lovelaceAmount.RewardAmount;
			});
	});

	return _partialSum;
};

export const getOutputPureLovelaceSum = (currentOutputBatch: Array<PendingReward>): number => {
	if (currentOutputBatch === null || currentOutputBatch === undefined) return 0;

	let _partialSum = 0;
	currentOutputBatch.forEach(pendingReward => {
		if (pendingReward.rewards.find(e => e.RewardType !== 3) === undefined) {
			pendingReward.rewards
				.filter(e => e.RewardType === 3)
				.forEach(lovelaceAmount => {
					_partialSum += lovelaceAmount.RewardAmount;
				});
		}
	});

	return _partialSum;
};

export const getOutputConclaveSum = (currentConclaveOutputBatch: Array<PendingReward>): number => {
	if (currentConclaveOutputBatch === null || currentConclaveOutputBatch === undefined) return 0;

	let _partialSum = 0;
	currentConclaveOutputBatch.forEach(reward => {
		reward.rewards
			.filter(e => e.RewardType !== 3)
			.forEach(conclaveAmount => {
				_partialSum += conclaveAmount.RewardAmount;
			});
	});

	return _partialSum;
};

export const getInputAssetUTXOSum = (
	currentUTXOs: Array<TxBodyInput> | null | undefined,
	unit: string = 'lovelace'
): number => {
	if (currentUTXOs === null || currentUTXOs === undefined || currentUTXOs.length === 0) return 0;

	let _partialSum = 0;
	currentUTXOs.forEach(utxo => {
		if (
			utxo.asset.find(f => f.unit == unit) !== undefined &&
			utxo.asset.find(f => f.unit == unit) !== null &&
			utxo.asset.find(f => f.unit == unit)?.quantity !== undefined &&
			utxo.asset.find(f => f.unit == unit)?.quantity !== null
		) {
			_partialSum += parseInt(utxo.asset.find(f => f.unit == unit)!.quantity);
		}
	});

	return _partialSum;
};

export const conclaveInputSum = (inputs: Array<TxBodyInput> | null | undefined): number => {
	return getInputAssetUTXOSum(inputs, POLICY_STRING);
};

export const conclaveOutputSum = (outputs: Array<PendingReward>): number => {
	return getOutputConclaveSum(outputs);
};

export const lovelaceInputSum = (inputs: Array<TxBodyInput>): number => {
	return getInputAssetUTXOSum(inputs);
};

export const lovelaceRewardOutputSum = (inputs: Array<PendingReward>): number => {
	return getOutputLovelaceSum(inputs);
};

export const lovelaceOutputSum = (outputs: Array<PendingReward>): number => {
	return getOutputLovelaceSum(outputs);
};

export const purelovelaceOutputSum = (outputs: Array<PendingReward>): number => {
	return getOutputPureLovelaceSum(outputs);
};

export const reserveLovelaceSum = (reservedInputs: Array<TxBodyInput>): number => {
	return getInputAssetUTXOSum(reservedInputs);
};

export const getTotalQuantity = (unit: string, data: TxBodyInput[]) => {
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

export const getTotalRewardQuantity = (isAda: boolean, data: PendingReward[]) => {
	return data
		.map(out =>
			out.rewards
				.filter(reward => (isAda ? reward.RewardType === 3 : reward.RewardType !== 3))
				.map(reward => Number(reward.RewardAmount))
				.reduce((acc, next) => acc + next)
		)
		.reduce((acc, next) => acc + next);
};
