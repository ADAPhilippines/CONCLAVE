import { Reward } from '../types/database-types';
import { PendingReward } from '../types/helper-types';
import { ProtocolParametersResponse, RewardTxBodyDetails, TxBodyInput } from '../types/response-types';
import {
	isEmpty,
	isInputSumLarger,
	isNull,
	isOutputSumLarger,
	isUndefined,
	isWithinTxSizeLimit,
	isZero,
} from './boolean-utils';
import { deductRewardFees } from './fees-utils';
import {
	addSmallestConclaveReward,
	addSmallestLovelaceReward,
	getArrayBatch,
	removeLargestConclaveReward,
	removeLargestLovelaceReward,
	removeLastItem,
} from './list-utils';
import {
	conclaveOutputSum,
	conclaveInputSum,
	lovelaceInputSum,
	lovelaceOutputSum,
	lovelaceRewardOutputSum,
	reserveLovelaceSum,
} from './sum-utils';
import { createRewardTxBodywithFee } from './txBody/txBody-utils';

export const coinSelectionAsync = async (
	conclaveUTXOInputs: Array<TxBodyInput>,
	conclaveBodyOutputs: Array<PendingReward>,
	id: string,
	protocolParameter: ProtocolParametersResponse
): Promise<RewardTxBodyDetails | null> => {
	let currentConclaveInputsBatch: Array<TxBodyInput> = conclaveUTXOInputs;
	let currentConclaveOutputsBatch: Array<PendingReward> = [];

	let isWithinLimit = await isWithinTxSizeLimit(
		currentConclaveInputsBatch,
		currentConclaveOutputsBatch,
		id,
		protocolParameter
	);
	if (isNull(isWithinLimit)) return null;
	while (
		isWithinLimit &&
		(isInputSumLarger(
			conclaveInputSum(currentConclaveInputsBatch),
			conclaveOutputSum(currentConclaveOutputsBatch)
		) ||
			isInputSumLarger(
				lovelaceInputSum(currentConclaveInputsBatch),
				lovelaceOutputSum(currentConclaveOutputsBatch) + 1000000
			))
	) {
		if (isEmpty(conclaveBodyOutputs)) break;
		if (
			isInputSumLarger(
				conclaveInputSum(currentConclaveInputsBatch),
				conclaveOutputSum(currentConclaveOutputsBatch)
			) &&
			isInputSumLarger(
				lovelaceInputSum(currentConclaveInputsBatch),
				lovelaceOutputSum(currentConclaveOutputsBatch)
			) &&
			!isZero(conclaveOutputSum(conclaveBodyOutputs))
		) {
			addSmallestConclaveReward(currentConclaveOutputsBatch, conclaveBodyOutputs);
		} else if (
			isInputSumLarger(
				lovelaceInputSum(currentConclaveInputsBatch),
				lovelaceOutputSum(currentConclaveOutputsBatch)
			) &&
			!isZero(lovelaceOutputSum(conclaveBodyOutputs))
		) {
			addSmallestLovelaceReward(currentConclaveOutputsBatch, conclaveBodyOutputs);
		} else break;
		isWithinLimit = await isWithinTxSizeLimit(
			currentConclaveInputsBatch,
			currentConclaveOutputsBatch,
			id,
			protocolParameter
		);
		if (isNull(isWithinLimit)) return null;
	}
	if (
		isZero(lovelaceOutputSum(currentConclaveOutputsBatch)) &&
		isZero(conclaveOutputSum(currentConclaveOutputsBatch))
	)
		return null;

	while (
		!isWithinLimit ||
		isOutputSumLarger(
			conclaveOutputSum(currentConclaveOutputsBatch),
			conclaveInputSum(currentConclaveInputsBatch)
		) ||
		isOutputSumLarger(
			lovelaceOutputSum(currentConclaveOutputsBatch) + 1000000,
			lovelaceInputSum(currentConclaveInputsBatch)
		)
	) {
		if (
			isOutputSumLarger(
				conclaveOutputSum(currentConclaveOutputsBatch),
				conclaveInputSum(currentConclaveInputsBatch)
			)
		) {
			removeLargestConclaveReward(currentConclaveOutputsBatch);
		} else if (
			isOutputSumLarger(
				lovelaceOutputSum(currentConclaveOutputsBatch),
				lovelaceInputSum(currentConclaveInputsBatch)
			)
		) {
			removeLargestLovelaceReward(currentConclaveOutputsBatch);
			continue;
		}
		removeLastItem(currentConclaveOutputsBatch);
		isWithinLimit = await isWithinTxSizeLimit(
			currentConclaveInputsBatch,
			currentConclaveOutputsBatch,
			id,
			protocolParameter
		);
	}

	if (
		(isZero(conclaveOutputSum(currentConclaveOutputsBatch)) &&
			isZero(lovelaceOutputSum(currentConclaveOutputsBatch))) ||
		!isInputSumLarger(
			conclaveInputSum(currentConclaveInputsBatch),
			conclaveOutputSum(currentConclaveOutputsBatch)
		) ||
		!isInputSumLarger(lovelaceInputSum(currentConclaveInputsBatch), lovelaceOutputSum(currentConclaveOutputsBatch))
	)
		return null;

	let newTxBodyDetails: RewardTxBodyDetails | null = await createRewardTxBodywithFee(
		currentConclaveInputsBatch,
		currentConclaveOutputsBatch,
		lovelaceOutputSum(currentConclaveOutputsBatch),
		protocolParameter
	);

	if (newTxBodyDetails == null || newTxBodyDetails == undefined) {
		return null;
	}

	deductRewardFees(newTxBodyDetails);
	return newTxBodyDetails;
};
