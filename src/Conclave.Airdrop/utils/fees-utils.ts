import { Reward } from '../types/database-types';
import { PendingReward } from '../types/helper-types';
import { ProtocolParametersResponse, RewardTxBodyDetails } from '../types/response-types';
import { isNull } from './boolean-utils';
import { createRewardTxBodyAsync } from './txBody/txBody-utils';
import { initReward, initRewardTxBodyDetails } from './type-utils';

export const calculateRewardFeesAsync = async (
	newTxBodyDetails: RewardTxBodyDetails,
	protocolParameter: ProtocolParametersResponse
): Promise<string | null> => {
	let _txOutputs: Array<PendingReward> = [];

	const _newTxBodyDetails: RewardTxBodyDetails = initRewardTxBodyDetails(
		newTxBodyDetails.txInputs,
		newTxBodyDetails.txOutputSum
	);

	newTxBodyDetails.txOutputs.forEach(e => {
		let _pendingReward: PendingReward = {
			stakeAddress: e.stakeAddress,
			rewards: [],
		};

		e.rewards.forEach(reward => {
			let _reward: Reward = initReward(
				reward.id,
				2000000,
				reward.rewardType,
				reward.walletAddress,
				reward.stakeAddress
			);
			_pendingReward.rewards.push(_reward);
		});

		_txOutputs.push(_pendingReward);
	});
	_newTxBodyDetails.txOutputs = _txOutputs;

	let _result = await createRewardTxBodyAsync(_newTxBodyDetails, protocolParameter);
	if (isNull(_result)) return null;

	return _result!.txBody.fee().to_str();
};

export const deductRewardFees = (txBodyDetails: RewardTxBodyDetails) => {
	let newFee = parseInt(txBodyDetails.fee) + 200;
	txBodyDetails.txOutputs.forEach(e => {
		e.rewards.find(f => f.rewardType == 3)!.rewardAmount = parseInt(
			(
				e.rewards.find(f => f.rewardType == 3)!.rewardAmount -
				(newFee / txBodyDetails.txOutputSum) * e.rewards.find(f => f.rewardType == 3)!.rewardAmount
			).toFixed()
		);
	});
};
