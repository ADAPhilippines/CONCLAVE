import { ProtocolParametersResponse, RewardTxBodyDetails, TxBodyInput } from '../types/response-types';
import { isNull } from './boolean-utils';
import { initRewardTxBodyDetails } from './type-utils';
import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';
import { calculateRewardFeesAsync, setTTLAsync } from './transaction-utils';
import { getTransactionBuilder } from '../config/transaction.config';
import { PendingReward } from '../types/helper-types';
import { setTimeout } from 'timers/promises';
import { ASSET_NAME, POLICY_ID, POLICY_STRING, SHELLEY_CHANGE_ADDRESS, SHELLEY_OUTPUT_ADDRESS, VERIFY_KEY } from '../config/walletKeys.config';
import { Reward } from '../types/database-types';
import RewardType from '../enums/reward-type';

export const createRewardTxBodywithFee = async (
	inputs: Array<TxBodyInput>,
	outputs: Array<PendingReward>,
	outputSum: number,
	protocolParameters: ProtocolParametersResponse
): Promise<RewardTxBodyDetails | null> => {
	const newTxBodyDetails: RewardTxBodyDetails = initRewardTxBodyDetails(inputs, outputSum, '0', outputs);

	let fees = await calculateRewardFeesAsync(newTxBodyDetails, protocolParameters);
	if (isNull(fees)) return null;

	newTxBodyDetails.fee = fees!;

	return newTxBodyDetails;
};

export const createRewardTxBodyAsync = async (
	txBodyDetails: RewardTxBodyDetails,
	protocolParameters: ProtocolParametersResponse
): Promise<{ txHash: CardanoWasm.TransactionHash; txBody: CardanoWasm.TransactionBody } | null> => {
	const MAX_NUMBER_OF_RETRIES = 3;
	let retryCount = 0;

	while (retryCount < MAX_NUMBER_OF_RETRIES) {
		try {
			let txBuilder = await setRewardTxBodyDetailsAsync(txBodyDetails, protocolParameters);
			if (txBuilder === null) throw new Error('Error creating transaction builder');
			let ttl = await setTTLAsync();
			txBuilder.set_ttl(CardanoWasm.BigNum.from_str(ttl.toString()));
			txBuilder.add_change_if_needed(SHELLEY_CHANGE_ADDRESS);
			const txBody = txBuilder.build();
			const txHash = CardanoWasm.hash_transaction(txBody);

			return { txHash, txBody };
		} catch (error) {
			const interval = parseInt((5000 * Math.random()).toFixed());
			console.log(`error creating transaction body, retrying in ${interval} ms...\nNumber of retries: ${retryCount} ` + error);
			await setTimeout(3000 + interval);
			retryCount++;
		}
	}
	return null;
};

export const setRewardTxBodyDetailsAsync = async (
	txBodyDetails: RewardTxBodyDetails,
	protocolParameter: any
): Promise<CardanoWasm.TransactionBuilder | null> => {
	try {
		let txBuilder = getTransactionBuilder(protocolParameter);
		setTxInputs(txBuilder, txBodyDetails.txInputs);
		setTxOutputs(txBuilder, txBodyDetails.txOutputs);
		return txBuilder;
	} catch (error) {
		console.log(`error setting transaction body details`);
		console.log(error);
	}
	return null;
};

export const setTxOutputs = (txBuilder: CardanoWasm.TransactionBuilder, txOutputs: Array<PendingReward>) => {
	txOutputs.forEach((txOutput: PendingReward) => {
		const totalAdaReward = txOutput.rewards
			.filter(r => r.RewardType === RewardType.ConclaveOwnerReward)
			.map(r => r.RewardAmount)
			.reduce((a, b) => a + b, 0)
			.toFixed();
		const outputValue = CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(totalAdaReward));

		if (txOutput.rewards.find(e => e.RewardType != 3)) {
			const totalConclaveReward = txOutput.rewards
				.filter(r => r.RewardType !== RewardType.ConclaveOwnerReward)
				.map(r => r.RewardAmount)
				.reduce((a, b) => a + b, 0)
				.toFixed();

			let multiAssetOutput = CardanoWasm.MultiAsset.new();
			let assetsOutput = CardanoWasm.Assets.new();

			assetsOutput.insert(CardanoWasm.AssetName.new(Buffer.from(ASSET_NAME!, 'hex')), CardanoWasm.BigNum.from_str(totalConclaveReward));
			multiAssetOutput.insert(CardanoWasm.ScriptHash.from_bytes(Buffer.from(POLICY_ID!, 'hex')), assetsOutput);

			outputValue.set_multiasset(multiAssetOutput);
		}

		txBuilder.add_output(CardanoWasm.TransactionOutput.new(CardanoWasm.Address.from_bech32(txOutput.rewards[0].WalletAddress), outputValue));
	});
};

export const setTxInputs = (txBuilder: CardanoWasm.TransactionBuilder, txInputs: Array<TxBodyInput>) => {
	txInputs.forEach(txInput => {
		const inputValue = CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(txInput.asset.find(e => e.unit == 'lovelace')!.quantity));
		if (txInput.asset.find(e => e.unit === POLICY_STRING)) {
			let multiAssetInput = CardanoWasm.MultiAsset.new();
			let assetsInput = CardanoWasm.Assets.new();
			assetsInput.insert(
				CardanoWasm.AssetName.new(Buffer.from(ASSET_NAME!, 'hex')),
				CardanoWasm.BigNum.from_str(txInput.asset.find(e => e.unit == POLICY_STRING)!.quantity)
			);
			multiAssetInput.insert(CardanoWasm.ScriptHash.from_bytes(Buffer.from(POLICY_ID!, 'hex')), assetsInput);

			inputValue.set_multiasset(multiAssetInput);
		}

		txBuilder.add_key_input(
			VERIFY_KEY.hash(),
			CardanoWasm.TransactionInput.new(
				CardanoWasm.TransactionHash.from_bytes(Buffer.from(txInput.txHash, 'hex')), // tx hash
				CardanoWasm.BigNum.from_str(txInput.outputIndex) // index
			),
			inputValue
		);
	});
};

export const dummyInProgress = (): Array<PendingReward> => {
	let dummyData: Array<PendingReward> = [];

	for (let i = 0; i < 300; i++) {
		const reward: Reward = {
			Id: 'random id1',
			WalletAddress: SHELLEY_OUTPUT_ADDRESS.to_bech32(),
			RewardType: 3,
			RewardAmount: 2_100_000, //2ADA
			StakeAddress: 'random stake address' + i,
			TransactionHash: 'random_tx_hash1',
		};

		const pendingReward: PendingReward = {
			stakeAddress: 'random id1' + i,
			rewards: [reward],
		};
		dummyData.push(pendingReward);
	}

	for (let i = 0; i < 10; i++) {
		const reward: Reward = {
			Id: 'random id1',
			WalletAddress: SHELLEY_OUTPUT_ADDRESS.to_bech32(),
			RewardType: 3,
			RewardAmount: 20_100_000, //2ADA
			StakeAddress: 'random stake address' + i,
			TransactionHash: 'random_tx_hash2',
		};

		const pendingReward: PendingReward = {
			stakeAddress: 'random id1' + i,
			rewards: [reward],
		};
		dummyData.push(pendingReward);
	}

	return dummyData;
};
export const dummyDataOutput = (): Array<PendingReward> => {
	let dummyData: Array<PendingReward> = [];

	for (let i = 0; i < 500; i++) {
		const reward: Reward = {
			Id: 'random id1',
			WalletAddress: SHELLEY_OUTPUT_ADDRESS.to_bech32(),
			RewardType: 3,
			RewardAmount: 2_000_100_000, //2ADA
			StakeAddress: 'random stake address' + i,
			TransactionHash: null,
		};

		const pendingReward: PendingReward = {
			stakeAddress: 'random id1' + i,
			rewards: [reward],
		};
		dummyData.push(pendingReward);
	}

	// for (let i = 0; i < 1800; i++) {
	// 	const reward: Reward = {
	// 		Id: 'random id1',
	// 		WalletAddress: SHELLEY_OUTPUT_ADDRESS.to_bech32(),
	// 		RewardType: 3,
	// 		RewardAmount: 2000_100_000, //2ADA
	// 		StakeAddress: 'random stake address' + i,
	// 		TransactionHash: null,
	// 	};

	// 	const pendingReward: PendingReward = {
	// 		stakeAddress: 'random id1' + i,
	// 		rewards: [reward],
	// 	};
	// 	dummyData.push(pendingReward);
	// }

	for (let i = 0; i < 50; i++) {
		const reward: Reward = {
			Id: 'random id1',
			WalletAddress: SHELLEY_OUTPUT_ADDRESS.to_bech32(),
			RewardType: 3,
			RewardAmount: 2_100_000, //2ADA
			StakeAddress: 'random stake address 0' + i + 'r',
			TransactionHash: null,
		};

		const reward1: Reward = {
			Id: 'random id2',
			WalletAddress: SHELLEY_OUTPUT_ADDRESS.to_bech32(),
			RewardType: 1,
			RewardAmount: 500, //5CONCLAVE
			StakeAddress: 'random stake address 1' + i + 'r',
			TransactionHash: null,
		};

		const reward3: Reward = {
			Id: 'random id3',
			WalletAddress: SHELLEY_OUTPUT_ADDRESS.to_bech32(),
			RewardType: 2,
			RewardAmount: 200, //2CONCLAVE
			StakeAddress: 'random stake address 2' + i + 'r',
			TransactionHash: null,
		};

		const pendingReward: PendingReward = {
			stakeAddress: 'random id1',
			rewards: [reward, reward1, reward3],
		};
		dummyData.push(pendingReward);
	}

	// for (let i = 0; i < 10; i++) {
	// 	const reward: Reward = {
	// 		Id: 'random id1',
	// 		WalletAddress: SHELLEY_OUTPUT_ADDRESS.to_bech32(),
	// 		RewardType: 3,
	// 		RewardAmount: 252000000, //2ADA
	// 		StakeAddress: 'random stake address 0' + i + 'r',
	// 	};

	// 	const reward3: Reward = {
	// 		Id: 'random id3',
	// 		WalletAddress: SHELLEY_OUTPUT_ADDRESS.to_bech32(),
	// 		RewardType: 2,
	// 		RewardAmount: 90000000, //2CONCLAVE
	// 		StakeAddress: 'random stake address 2' + i + 'r',
	// 	};

	// 	const pendingReward: PendingReward = {
	// 		stakeAddress: 'random id1',
	// 		rewards: [reward, reward3],
	// 	};
	// 	dummyData.push(pendingReward);
	// }

	return dummyData;
};
