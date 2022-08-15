import { Reward } from '../types/database-types';
import { PendingReward } from '../types/helper-types';
import { AirdropBatch, RewardTxBodyDetails, TxBodyInput } from '../types/response-types';

export const initRewardTxBodyDetails = (
	inputs: Array<TxBodyInput>,
	outputSum: number,
	fee: string = '0',
	outputs: Array<PendingReward> = []
): RewardTxBodyDetails => {
	const newTxBodyDetails: RewardTxBodyDetails = {
		txInputs: inputs,
		txOutputs: outputs,
		fee: fee,
		txOutputSum: outputSum,
	};

	return newTxBodyDetails;
};

export const initReward = (
	id: string,
	rewardAmount: number,
	rewardType: number,
	walletAddress: string,
	stakeAddress: string,
	transactionHash: string | null = null
) => {
	let _reward: Reward = {
		Id: id,
		RewardType: rewardType,
		WalletAddress: walletAddress,
		RewardAmount: rewardAmount,
		StakeAddress: stakeAddress,
		TransactionHash: transactionHash,
	};
	return _reward;
};

export const initAirdropBatch = (
	txInputs: Array<TxBodyInput>,
	txOutputs: Array<PendingReward>,
	isProcessing: boolean = false,
	index: number = 0,
	txHash: string | null = null
): AirdropBatch => {
	let _airdropBatch: AirdropBatch = {
		txInputs: txInputs,
		txOutputs: txOutputs,
		isProcessing: isProcessing,
		index: index,
		txHash: txHash,
	};
	return _airdropBatch;
};
