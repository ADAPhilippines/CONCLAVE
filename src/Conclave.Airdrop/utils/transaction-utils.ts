import { RewardTxBodyDetails, TxBodyInput, ProtocolParametersResponse, TransactionData } from '../types/response-types';
import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';
import { createRewardTxBodyAsync, createRewardTxBodywithFee } from './txBody-utils';
import { isEmpty, isInputSumLarger, isNull, isNullOrUndefined, isOutputSumLarger, isUndefined, isWithinTxSizeLimit, isZero } from './boolean-utils';
import { PendingReward } from '../types/helper-types';
import { setTimeout } from 'timers/promises';
import AirdropTransactionStatus from '../enums/airdrop-transaction-status';
import { SIGN_KEY } from '../config/walletKeys.config';
import { conclaveInputSum, conclaveOutputSum, lovelaceInputSum, lovelaceOutputSum, purelovelaceOutputSum } from './sum-utils';
import {
	addSmallestConclaveOrSmallestLovelaceReward,
	addSmallestConclaveReward,
	addSmallestLovelaceReward,
	getIdxSmallestConclaveReward,
	removeLargestConclaveReward,
	removeLargestLovelaceReward,
	removeLastItem,
} from './list-utils';
import { initReward, initRewardTxBodyDetails } from './type-utils';
import { Reward } from '../types/database-types';
import { getBlock, getLatestBlockAsync, getTransactionData, submitTransactionToChain } from './blockFrost-tools';
import { consoleWithWorkerId } from '../worker';

export const setTTLAsync = async (): Promise<number> => {
	const latestBlock = await getLatestBlockAsync();
	const currentSlot = latestBlock.slot;

	return currentSlot! + 20 * 20; //after 20 blocks
};

export const signTxBody = (
	txHash: CardanoWasm.TransactionHash,
	txBody: CardanoWasm.TransactionBody,
	signKey: CardanoWasm.PrivateKey
): CardanoWasm.Transaction | null => {
	try {
		const witnesses = CardanoWasm.TransactionWitnessSet.new();
		const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
		const vkeyWitness = CardanoWasm.make_vkey_witness(txHash, signKey);
		vkeyWitnesses.add(vkeyWitness);
		witnesses.set_vkeys(vkeyWitnesses);

		const transaction = createTxBody(txBody, witnesses);

		return transaction;
	} catch (error) {
		console.log('Error Signing Transaction body ' + error);
		return null;
	}
};

export const createTxBody = (txBody: CardanoWasm.TransactionBody, witnesses: CardanoWasm.TransactionWitnessSet): CardanoWasm.Transaction | null => {
	try {
		const transaction = CardanoWasm.Transaction.new(txBody, witnesses);
		return transaction;
	} catch (error) {
		console.log('Error Creating Transaction body ' + error);
		return null;
	}
};

export const submitTransactionAsync = async (
	transaction: CardanoWasm.Transaction,
	txHashString: string
): Promise<{ status: number; message: string; txHashString: string }> => {
	const MAX_NUMBER_OF_RETRIES = 30;
	let retryCount = 0;

	while (retryCount <= MAX_NUMBER_OF_RETRIES) {
		try {
			await submitTransactionToChain(transaction.to_bytes());

			consoleWithWorkerId.log('Transaction Submitted Successfully');
			return {
				status: AirdropTransactionStatus.Success,
				message: 'Submission Successful: Transaction submitted!',
				txHashString,
			};
		} catch (error) {
			const interval = parseInt((5000 * Math.random()).toFixed());
			console.log(`error submitting, retrying in ${interval} ms...\nNumber of retries: ${retryCount}`);
			console.log(error);
			await setTimeout(interval);
			retryCount++;
		}
	}

	return {
		status: AirdropTransactionStatus.New,
		message: 'Submission Error: Maximum number of retries reached',
		txHashString: '',
	};
};

export const createAndSignTxAsync = async (
	txBodyDetails: RewardTxBodyDetails,
	protocolParameter: any
): Promise<{
	transaction: CardanoWasm.Transaction;
	txHash: CardanoWasm.TransactionHash;
} | null> => {
	let txBodyResult = await createRewardTxBodyAsync(txBodyDetails, protocolParameter);
	if (isNull(txBodyResult)) return null;

	let txSigned = signTxBody(txBodyResult!.txHash, txBodyResult!.txBody, SIGN_KEY);
	if (isNull(txSigned)) return null;

	return { transaction: txSigned!, txHash: txBodyResult!.txHash };
};

export const transactionConfirmation = async (
	txHashString: string,
	confirmationCount: number = 20
): Promise<{ status: number; message: string; txHashString: string }> => {
	let txData: TransactionData | null = null;

	let MAX_NUMBER_OF_RETRIES = 100;
	let retryCount = 0;

	while (retryCount <= MAX_NUMBER_OF_RETRIES) {
		try {
			txData = await getTransactionData(txHashString);
			break;
		} catch (err) {
			const interval = parseInt((15000 * Math.random()).toFixed());
			consoleWithWorkerId.log(`Tx data not yet available for txHash: ${txHashString}, re-fetching in ${(15000 + interval) / 1000} seconds...`);

			await setTimeout(15000 + interval);
		}
	}

	if (retryCount > MAX_NUMBER_OF_RETRIES) {
		return {
			status: AirdropTransactionStatus.New,
			message: 'Confirmation Error: Maximum number of retries reached',
			txHashString: '',
		};
	}

	//what if txData fails
	MAX_NUMBER_OF_RETRIES = 50;
	retryCount = 0;

	while (retryCount <= MAX_NUMBER_OF_RETRIES) {
		try {
			let block = await getBlock(txData!.block);
			const interval = parseInt((30000 * Math.random()).toFixed());
			consoleWithWorkerId.log(
				`Confirmations for txHash: ${txHashString}: ${block.confirmations}/${confirmationCount} retrying in ${(interval + 20000) / 1000}s...`
			);

			if (block.confirmations >= confirmationCount) {
				consoleWithWorkerId.log('Transaction Confirmed for ' + txHashString);
				return {
					status: AirdropTransactionStatus.Success,
					message: 'Confirmation Success: Transaction Confirmed',
					txHashString,
				};
			}
			await setTimeout(20000 + interval);
		} catch (error) {
			const interval = parseInt((3000 * Math.random()).toFixed());
			consoleWithWorkerId.log(`error in confirmation, retrying in ${5000 + interval} ms...\nNumber of retries: ${retryCount}\n ${error}`);
			await setTimeout(interval + 5000);
			retryCount++;
		}
	}

	return {
		status: AirdropTransactionStatus.New,
		message: 'Confirmation Error: Maximum number of retries reached',
		txHashString: '',
	};
};

export const coinSelectionAsync = async (
	conclaveUTXOInputs: Array<TxBodyInput>,
	conclaveBodyOutputs: Array<PendingReward>,
	protocolParameter: ProtocolParametersResponse
): Promise<RewardTxBodyDetails | null> => {
	let currentConclaveInputsBatch: Array<TxBodyInput> = conclaveUTXOInputs;
	let currentConclaveOutputsBatch: Array<PendingReward> = [];

	let isWithinLimit = await isWithinTxSizeLimit(currentConclaveInputsBatch, currentConclaveOutputsBatch, protocolParameter);
	if (isNull(isWithinLimit)) return null;

	while (
		isWithinLimit &&
		!isOutputSumLarger(conclaveOutputSum(currentConclaveOutputsBatch), conclaveInputSum(currentConclaveInputsBatch)) &&
		!isOutputSumLarger(lovelaceOutputSum(currentConclaveOutputsBatch) + 2_100_000, lovelaceInputSum(currentConclaveInputsBatch))
	) {
		if (isEmpty(conclaveBodyOutputs)) break;
		if (
			isInputSumLarger(conclaveInputSum(currentConclaveInputsBatch), conclaveOutputSum(currentConclaveOutputsBatch)) &&
			isInputSumLarger(lovelaceInputSum(currentConclaveInputsBatch), lovelaceOutputSum(currentConclaveOutputsBatch) + 2_100_000) &&
			!isZero(conclaveOutputSum(conclaveBodyOutputs))
		) {
			addSmallestConclaveOrSmallestLovelaceReward(currentConclaveOutputsBatch, conclaveBodyOutputs, currentConclaveInputsBatch);
		} else if (
			isInputSumLarger(lovelaceInputSum(currentConclaveInputsBatch), lovelaceOutputSum(currentConclaveOutputsBatch) + 2_100_000) &&
			!isZero(lovelaceOutputSum(conclaveBodyOutputs))
		) {
			addSmallestLovelaceReward(currentConclaveOutputsBatch, conclaveBodyOutputs);
		}

		isWithinLimit = await isWithinTxSizeLimit(currentConclaveInputsBatch, currentConclaveOutputsBatch, protocolParameter);
		if (isNull(isWithinLimit)) return null;
	}
	if (isZero(lovelaceOutputSum(currentConclaveOutputsBatch))) return null;

	isWithinLimit = await isWithinTxSizeLimit(currentConclaveInputsBatch, currentConclaveOutputsBatch, protocolParameter);
	if (isNull(isWithinLimit)) return null;

	while (
		!isWithinLimit ||
		isOutputSumLarger(conclaveOutputSum(currentConclaveOutputsBatch), conclaveInputSum(currentConclaveInputsBatch)) ||
		isOutputSumLarger(lovelaceOutputSum(currentConclaveOutputsBatch) + 2_100_000, lovelaceInputSum(currentConclaveInputsBatch))
	) {
		if (isOutputSumLarger(conclaveOutputSum(currentConclaveOutputsBatch), conclaveInputSum(currentConclaveInputsBatch))) {
			removeLargestConclaveReward(currentConclaveOutputsBatch);
		} else if (isOutputSumLarger(lovelaceOutputSum(currentConclaveOutputsBatch) + 2_100_000, lovelaceInputSum(currentConclaveInputsBatch))) {
			removeLargestLovelaceReward(currentConclaveOutputsBatch);
		} else removeLastItem(currentConclaveOutputsBatch);

		isWithinLimit = await isWithinTxSizeLimit(currentConclaveInputsBatch, currentConclaveOutputsBatch, protocolParameter);
		if (isNull(isWithinLimit)) return null;
	}

	if (
		isZero(lovelaceOutputSum(currentConclaveOutputsBatch)) ||
		isOutputSumLarger(conclaveOutputSum(currentConclaveOutputsBatch), conclaveInputSum(currentConclaveInputsBatch)) ||
		isOutputSumLarger(lovelaceOutputSum(currentConclaveOutputsBatch) + 2_100_000, lovelaceInputSum(currentConclaveInputsBatch))
	)
		return null;

	let newTxBodyDetails: RewardTxBodyDetails | null = await createRewardTxBodywithFee(
		currentConclaveInputsBatch,
		currentConclaveOutputsBatch,
		lovelaceOutputSum(currentConclaveOutputsBatch),
		protocolParameter
	);
	if (isNullOrUndefined(newTxBodyDetails)) return null;

	deductRewardFees(newTxBodyDetails!);
	return newTxBodyDetails;
};

export const calculateRewardFeesAsync = async (
	newTxBodyDetails: RewardTxBodyDetails,
	protocolParameter: ProtocolParametersResponse
): Promise<string | null> => {
	let _txOutputs: Array<PendingReward> = [];

	const _newTxBodyDetails: RewardTxBodyDetails = initRewardTxBodyDetails(newTxBodyDetails.txInputs, newTxBodyDetails.txOutputSum);

	newTxBodyDetails.txOutputs.forEach(e => {
		let _pendingReward: PendingReward = {
			stakeAddress: e.stakeAddress,
			rewards: [],
		};

		e.rewards.forEach(reward => {
			let _reward: Reward = initReward(
				reward.Id,
				reward.RewardType === 3 ? 2_100_000 : 2,
				reward.RewardType,
				reward.WalletAddress,
				reward.StakeAddress
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
		e.rewards.find(f => f.RewardType == 3)!.RewardAmount = parseInt(
			(
				e.rewards.find(f => f.RewardType == 3)!.RewardAmount -
				(newFee / txBodyDetails.txOutputSum) * e.rewards.find(f => f.RewardType == 3)!.RewardAmount
			).toFixed()
		);
	});
};
