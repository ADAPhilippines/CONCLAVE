import { BlockfrostServerError } from '@blockfrost/blockfrost-js';
import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';
import { fromHex, toHex } from './string-utils';
import { CardanoAssetResponse, RewardTxBodyDetails, TxBodyInput, UTXO } from '../types/response-types';
import { Reward } from '../types/database-types';
import { getInputAssetUTXOSum } from './sum-utils';
import { isZero } from './boolean-utils';
import { PendingReward } from '../types/helper-types';
import { POLICY_STRING, SHELLEY_CHANGE_ADDRESS } from '../config/walletKeys.config';
import { getUTXOsfromAddress } from './blockFrost-tools';

export const getUtxosAsync = async (publicAddr: string) => {
	const utxosResults = await getUTXOsfromAddress(publicAddr);

	let utxos: CardanoWasm.TransactionUnspentOutput[] = [];

	for (const utxoResult of utxosResults) {
		utxos.push(
			CardanoWasm.TransactionUnspentOutput.new(
				CardanoWasm.TransactionInput.new(
					CardanoWasm.TransactionHash.from_bytes(fromHex(utxoResult.tx_hash)),
					CardanoWasm.BigNum.from_str(utxoResult.output_index.toString())
				),
				CardanoWasm.TransactionOutput.new(
					CardanoWasm.Address.from_bech32(publicAddr), // use own address since blockfrost does not provide
					amountToValue(utxoResult.amount)
				)
			)
		);
	}
	return utxos;
};

export const amountToValue = (amount: CardanoAssetResponse[]) => {
	var lovelaceAmt = amount.find(a => a.unit == 'lovelace') as CardanoAssetResponse;
	var val = CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(lovelaceAmt.quantity));
	for (const asset of amount.filter(a => a.unit != 'lovelace')) {
		val = val.checked_add(
			assetValue(
				CardanoWasm.BigNum.from_str('0'),
				asset.unit.substring(0, 56),
				asset.unit.substring(56),
				CardanoWasm.BigNum.from_str(asset.quantity)
			) as CardanoWasm.Value
		);
	}
	return val;
};

export const assetValue = (
	lovelaceAmt: CardanoWasm.BigNum,
	policyIdHex: string,
	assetNameHex: string,
	amount: CardanoWasm.BigNum
) => {
	const value = CardanoWasm.Value.new(lovelaceAmt);
	const ma = CardanoWasm.MultiAsset.new();
	const assets = CardanoWasm.Assets.new();

	assets.insert(CardanoWasm.AssetName.new(fromHex(assetNameHex)), amount);

	ma.insert(CardanoWasm.ScriptHash.from_bytes(fromHex(policyIdHex)), assets);

	value.set_multiasset(ma);
	return value;
};

export const getAllUTXOsAsync = async (walletAddress: string): Promise<Array<TxBodyInput>> => {
	let utxos = await queryAllUTXOsAsync(walletAddress);
	let txBodyInputs: Array<TxBodyInput> = [];

	utxos.forEach(utxo => {
		let assetArray: Array<CardanoAssetResponse> = [];
		utxo.amount.forEach(asset => {
			const cardanoAsset: CardanoAssetResponse = {
				unit: asset.unit,
				quantity: asset.quantity,
			};

			assetArray.push(cardanoAsset);
		});

		const utxoInput: TxBodyInput = {
			txHash: utxo.tx_hash,
			outputIndex: utxo.output_index.toString(),
			asset: assetArray,
		};

		txBodyInputs.push(utxoInput);
	});

	return txBodyInputs;
};

export const queryAllUTXOsAsync = async (address: string): Promise<UTXO> => {
	let utxos: UTXO = [];
	try {
		utxos = await getUTXOsfromAddress(address);
	} catch (error) {
		if (error instanceof BlockfrostServerError && error.status_code === 404) {
			utxos = [];
		} else {
			throw error;
		}
	}

	if (utxos.length === 0) {
		console.log();
		console.log(`You should send ADA to ${address} to have enough funds to sent a transaction`);
		console.log();
	}
	return utxos;
};

export const getUtxosWithAsset = async (address: string, unit: string): Promise<UTXO> => {
	let utxos: UTXO = await getUTXOsfromAddress(address);
	let utxosWithAsset: UTXO = [];

	if (utxos.length < 0) return utxos;

	for (let utxo of utxos) {
		for (let amount of utxo.amount) {
			if (amount.unit !== unit) continue;
			utxosWithAsset.push(utxo);
			break;
		}
	}

	return utxosWithAsset;
};

export const getPureAdaUtxos = async (address: string): Promise<UTXO> => {
	let utxos: UTXO = await getUTXOsfromAddress(address);
	if (utxos.length < 0) return utxos;

	let pureAdaUtxos: UTXO = [];

	for (let utxo of utxos) {
		var pureAda = true;
		for (let amount of utxo.amount) {
			if (amount.unit !== 'lovelace') pureAda = false;
			break;
		}

		if (pureAda) pureAdaUtxos.push(utxo);
	}

	return pureAdaUtxos;
};

function getLovelaceAboveThreshold(utxos: UTXO, threshold: number): Array<TxBodyInput> {
	let txBodyInputs: Array<TxBodyInput> = [];

	utxos.forEach(utxo => {
		if (
			utxo.amount.length == 1 &&
			utxo.amount[0].unit == 'lovelace' &&
			parseInt(utxo.amount.find(f => f.unit == 'lovelace')!.quantity) >= threshold
		) {
			let assetArray: Array<CardanoAssetResponse> = [];
			utxo.amount.forEach(asset => {
				const cardanoAsset: CardanoAssetResponse = {
					unit: asset.unit,
					quantity: asset.quantity,
				};

				assetArray.push(cardanoAsset);
			});

			const utxoInput: TxBodyInput = {
				txHash: utxo.tx_hash,
				outputIndex: utxo.output_index.toString(),
				asset: assetArray,
			};

			txBodyInputs.push(utxoInput);
		}
	});

	return txBodyInputs;
}

function getConclaveAboveThreshold(utxos: UTXO, threshold: number): Array<TxBodyInput> {
	let txBodyInputs: Array<TxBodyInput> = [];

	utxos.forEach(utxo => {
		if (
			utxo.amount.length != 1 &&
			utxo.amount.find(e => e.unit == POLICY_STRING) &&
			parseInt(utxo.amount.find(f => f.unit == POLICY_STRING)!.quantity) >= threshold
		) {
			let assetArray: Array<CardanoAssetResponse> = [];
			utxo.amount.forEach(asset => {
				const cardanoAsset: CardanoAssetResponse = {
					unit: asset.unit,
					quantity: asset.quantity,
				};

				assetArray.push(cardanoAsset);
			});

			const utxoInput: TxBodyInput = {
				txHash: utxo.tx_hash,
				outputIndex: utxo.output_index.toString(),
				asset: assetArray,
			};

			txBodyInputs.push(utxoInput);
		}
	});

	return txBodyInputs;
}

export const partitionUTXOs = (
	utxos: UTXO,
	lovelaceThreshold: number = 500_000_000,
	conclaveThreshold: number = 200_000_000
): {
	txInputs: Array<TxBodyInput>;
	txOutputs: Array<PendingReward>;
} | null => {
	let txBodyInputs: Array<TxBodyInput> = [];
	let txBodyOutputs: Array<PendingReward> = [];

	txBodyInputs.push(...getLovelaceAboveThreshold(utxos, lovelaceThreshold));
	txBodyInputs.push(...getConclaveAboveThreshold(utxos, conclaveThreshold));
	txBodyInputs = txBodyInputs.splice(0, 40);

	let lovelaceSum = getInputAssetUTXOSum(txBodyInputs);
	let conclaveSum = getInputAssetUTXOSum(txBodyInputs, POLICY_STRING);
	if (isZero(lovelaceSum) && isZero(conclaveSum)) return null;

	let lovelaceDivider = parseInt((lovelaceSum / (lovelaceThreshold / 2)).toFixed());
	let conclaveDivider = parseInt((conclaveSum / (conclaveThreshold / 2)).toFixed());
	let lovelaceRemainder = parseInt((lovelaceSum % (lovelaceThreshold / 2)).toFixed());
	let conclaveRemainder = parseInt((conclaveSum % (conclaveThreshold / 2)).toFixed());

	for (let i: number = 0; i < Math.max(conclaveDivider - 1, lovelaceDivider - 1); i++) {
		let pendingReward: PendingReward;

		if (i < conclaveDivider) {
			const conclaveReward: Reward = {
				Id: i.toString(),
				RewardType: 2,
				RewardAmount: conclaveThreshold / 2,
				WalletAddress: SHELLEY_CHANGE_ADDRESS.to_bech32(),
				StakeAddress: ' ',
				TransactionHash: null, // dito
			};

			if (i >= lovelaceDivider - 1) {
				if (!isZero(lovelaceRemainder)) lovelaceRemainder -= 2_100_000;
			}

			const lovelaceReward: Reward = {
				Id: i.toString(),
				RewardType: 3,
				RewardAmount: i >= lovelaceDivider - 1 ? 2_100_000 : lovelaceThreshold / 2,
				WalletAddress: SHELLEY_CHANGE_ADDRESS.to_bech32(),
				StakeAddress: ' ',
				TransactionHash: null,
			};

			pendingReward = {
				stakeAddress: ' ',
				rewards: [conclaveReward, lovelaceReward],
			};

			txBodyOutputs.push(pendingReward);
		} else {
			const lovelaceReward: Reward = {
				Id: i.toString(),
				RewardType: 3,
				RewardAmount: lovelaceThreshold / 2,
				WalletAddress: SHELLEY_CHANGE_ADDRESS.to_bech32(),
				StakeAddress: ' ',
				TransactionHash: null,
			};

			pendingReward = {
				stakeAddress: ' ',
				rewards: [lovelaceReward],
			};

			txBodyOutputs.push(pendingReward);
		}
	}

	if (!isZero(lovelaceRemainder)) {
		const lovelaceReward: Reward = {
			Id: '',
			RewardType: 3,
			RewardAmount: lovelaceRemainder,
			WalletAddress: SHELLEY_CHANGE_ADDRESS.to_bech32(),
			StakeAddress: ' ',
			TransactionHash: null,
		};

		if (!isZero(conclaveRemainder)) {
			const conclaveReward: Reward = {
				Id: '',
				RewardType: 2,
				RewardAmount: conclaveRemainder,
				WalletAddress: SHELLEY_CHANGE_ADDRESS.to_bech32(),
				StakeAddress: ' ',
				TransactionHash: null,
			};

			txBodyOutputs.push({
				stakeAddress: ' ',
				rewards: [lovelaceReward, conclaveReward],
			});
		} else {
			let remainining = {
				stakeAddress: ' ',
				rewards: [lovelaceReward],
			};

			txBodyOutputs.push(remainining);
		}
	}

	return { txInputs: txBodyInputs, txOutputs: txBodyOutputs };
};

// export const combineUTXOs = (
// 	utxos: UTXO,
// 	lovelaceThreshold: number = 100_000_000,
// 	conclaveThreshold: number = 1_000_000
// ): {
// 	txInputs: Array<TxBodyInput>;
// 	txOutputs: Array<PendingReward>;
// } | null => {
// 	let txBodyInputs: Array<TxBodyInput> = [];
// 	let txBodyOutputs: Array<PendingReward> = [];
// 	let lovelaceDivider: number = 1;
// 	let conclaveDivider: number = 1;

// 	utxos.forEach(utxo => {
// 		if (
// 			utxo.amount.length == 1 &&
// 			utxo.amount[0].unit == 'lovelace' &&
// 			parseInt(utxo.amount.find(f => f.unit == 'lovelace')!.quantity) <= lovelaceThreshold
// 		) {
// 			let assetArray: Array<CardanoAssetResponse> = [];
// 			utxo.amount.forEach(asset => {
// 				const cardanoAsset: CardanoAssetResponse = {
// 					unit: asset.unit,
// 					quantity: asset.quantity,
// 				};

// 				assetArray.push(cardanoAsset);
// 			});

// 			const utxoInput: TxBodyInput = {
// 				txHash: utxo.tx_hash,
// 				outputIndex: utxo.output_index.toString(),
// 				asset: assetArray,
// 			};

// 			txBodyInputs.push(utxoInput);
// 		}
// 	});
// 	txBodyInputs = txBodyInputs.splice(0, 100);

// 	let lovelaceSum = getInputAssetUTXOSum(txBodyInputs);
// 	let conclaveSum = getInputAssetUTXOSum(txBodyInputs, POLICY_STRING);
// 	if ((isZero(lovelaceSum) && isZero(conclaveSum)) || lovelaceSum <= 15_000_000) return null;

// 	lovelaceDivider = parseInt((lovelaceSum / 251_000_000).toFixed());
// 	let lovelaceRemainder = lovelaceSum % lovelaceThreshold;

// 	for (let i: number = 0; i < lovelaceDivider; i++) {
// 		const reward: Reward = {
// 			Id: i.toString(),
// 			RewardType: 3,
// 			RewardAmount: 251_000_000,
// 			WalletAddress: SHELLEY_CHANGE_ADDRESS.to_bech32(),
// 			StakeAddress: ' ',
// 			TransactionHash: null
// 		};

// 		const pendingReward: PendingReward = {
// 			stakeAddress: ' ',
// 			rewards: [reward],
// 		};

// 		txBodyOutputs.push(pendingReward);
// 	}

// 	if (txBodyOutputs.length == 0 && lovelaceRemainder > 15_000_000) {
// 		const reward: Reward = {
// 			Id: '0',
// 			RewardType: 3,
// 			RewardAmount: lovelaceRemainder,
// 			WalletAddress: SHELLEY_CHANGE_ADDRESS.to_bech32(),
// 			TransactionHash: null,
// 		};

// 		const pendingReward: PendingReward = {
// 			stakeAddress: ' ',
// 			rewards: [reward],
// 		};

// 		txBodyOutputs.push(pendingReward);
// 	}

// 	if (conclaveSum > 0) {
// 		const lovelaceReward: Reward = {
// 			Id: '0',
// 			RewardType: 3,
// 			RewardAmount: 2_200_000,
// 			WalletAddress: SHELLEY_CHANGE_ADDRESS.to_bech32(),
// 			StakeAddress: ' ',
// 		};

// 		const conclaveReward: Reward = {
// 			Id: '0',
// 			RewardType: 2,
// 			RewardAmount: conclaveSum,
// 			WalletAddress: SHELLEY_CHANGE_ADDRESS.to_bech32(),
// 			StakeAddress: ' ',
// 		};

// 		const pendingReward: PendingReward = {
// 			stakeAddress: ' ',
// 			rewards: [lovelaceReward, conclaveReward],
// 		};

// 		txBodyOutputs.push(pendingReward);
// 	}

// 	return { txInputs: txBodyInputs, txOutputs: txBodyOutputs };
// };

export const displayUTXOs = async (utxos: UTXO) => {
	console.log('Displaying All Available utxos');
	let displayUTXO: Array<displayUTXO> = [];

	utxos.forEach(utxo => {
		let assetArray: Array<string> = [];
		utxo.amount.forEach(asset => {
			assetArray.push(asset.quantity + ' ' + asset.unit);
		});

		displayUTXO.push({
			txHash: utxo.tx_hash,
			outputIndex: utxo.output_index.toString(),
			assets: assetArray.join(' + '),
		});
	});

	console.table(displayUTXO);
	console.log(' ');
	console.log(' ');
};

type displayUTXO = {
	txHash: string;
	outputIndex: string;
	assets: string;
};
