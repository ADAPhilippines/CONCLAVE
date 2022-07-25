import { TxBodyInput, AirdropBatch } from '../../types/response-types';
import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';
import { getAllUTXOsAsync } from '../airdrop-utils';
import { isEmpty, isNull, isZero } from '../boolean-utils';
import { Reward } from '../../types/database-types';
import { getOutputBatch } from './txOutput-utils';
import { conclaveInputSum, conclaveOutputSum, lovelaceInputSum } from '../sum-utils';
import { PendingReward } from '../../types/helper-types';
import { ASSET_NAME, POLICY_ID, POLICY_STRING, VERIFY_KEY } from '../../config/walletKeys.config';

export const setTxInputs = (txBuilder: CardanoWasm.TransactionBuilder, txInputs: Array<TxBodyInput>) => {
	txInputs.forEach(txInput => {
		const inputValue = CardanoWasm.Value.new(
			CardanoWasm.BigNum.from_str(txInput.asset.find(e => e.unit == 'lovelace')!.quantity)
		);

		if (
			txInput.asset.find(e => e.unit == POLICY_STRING) &&
			txInput.asset.find(e => e.unit == POLICY_STRING)!.quantity != '0'
		) {
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

export const getBatchesPerWorker = async (
	utxosInWallet: Array<TxBodyInput> | null = null,
	pendingRewards: Array<PendingReward> | null = null
): Promise<Array<AirdropBatch>> => {
	let outputBatches = await getOutputBatch(pendingRewards ?? [], 300);
	let inputOutputBatch: Array<AirdropBatch> = [];
	if (isNull(utxosInWallet) || isEmpty(utxosInWallet!)) return inputOutputBatch;

	outputBatches!.forEach(element => {
		if (isZero(lovelaceInputSum(utxosInWallet!))) return;
		let inputsBatch: Array<TxBodyInput> = [];
		if (!isZero(conclaveOutputSum(element))) {
			let addedConclaveUTXO =
				utxosInWallet!.find(
					e =>
						e.asset.find(a => a.unit == POLICY_STRING) &&
						parseInt(e.asset.find(a => a.unit == POLICY_STRING)!.quantity) >= 10000000
				) ??
				utxosInWallet!.find(
					e =>
						e.asset.find(a => a.unit == POLICY_STRING) &&
						parseInt(e.asset.find(a => a.unit == POLICY_STRING)!.quantity) >= 0
				) ??
				utxosInWallet!.find(e => parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) >= 248000000) ??
				utxosInWallet!.find(e => parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) >= 0);
			inputsBatch.push(addedConclaveUTXO!);
			utxosInWallet = utxosInWallet!.filter(
				e => e.txHash != addedConclaveUTXO!.txHash || e.outputIndex != addedConclaveUTXO!.outputIndex
			);

			while (conclaveInputSum(inputsBatch) < 10000000 && conclaveInputSum(utxosInWallet) > 0) {
				addedConclaveUTXO =
					utxosInWallet!.find(
						e =>
							e.asset.find(a => a.unit == POLICY_STRING) &&
							parseInt(e.asset.find(a => a.unit == POLICY_STRING)!.quantity) >= 10000000
					) ??
					utxosInWallet!.find(
						e =>
							e.asset.find(a => a.unit == POLICY_STRING) &&
							parseInt(e.asset.find(a => a.unit == POLICY_STRING)!.quantity) >= 0
					) ??
					utxosInWallet!.find(
						e => parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) >= 248000000
					) ??
					utxosInWallet!.find(e => parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) >= 0);
				inputsBatch.push(addedConclaveUTXO!);
				utxosInWallet = utxosInWallet.filter(
					e => e.txHash != addedConclaveUTXO!.txHash || e.outputIndex != addedConclaveUTXO!.outputIndex
				);
			}

			while (lovelaceInputSum(inputsBatch) < 248000000 && lovelaceInputSum(utxosInWallet) > 0) {
				let addedLovelaceUTXO: TxBodyInput =
					utxosInWallet!.find(
						e =>
							e.asset.find(a => a.unit != POLICY_STRING) &&
							parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) >= 250000000
					) ??
					utxosInWallet!.find(
						e =>
							e.asset.find(a => a.unit != POLICY_STRING) &&
							parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) >= 0
					) ??
					utxosInWallet!.find(e => parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) >= 0)!;
				inputsBatch.push(addedLovelaceUTXO!);
				utxosInWallet = utxosInWallet.filter(
					e => e.txHash != addedLovelaceUTXO!.txHash || e.outputIndex != addedLovelaceUTXO!.outputIndex
				);
			}

			let smallUTXO =
				utxosInWallet!.find(
					e =>
						e.asset.find(a => a.unit == POLICY_STRING) &&
						parseInt(e.asset.find(a => a.unit == POLICY_STRING)!.quantity) < 10000000
				) ?? utxosInWallet!.find(e => parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) < 248000000);
			if (smallUTXO) {
				inputsBatch.push(smallUTXO);
				utxosInWallet = utxosInWallet.filter(
					e => e.txHash != smallUTXO!.txHash || e.outputIndex != smallUTXO!.outputIndex
				);
			}
		} else {
			let addedLovelaceUTXO =
				utxosInWallet!.find(
					e =>
						e.asset.find(a => a.unit != POLICY_STRING) &&
						parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) >= 248000000
				) ??
				utxosInWallet!.find(
					e =>
						e.asset.find(a => a.unit != POLICY_STRING) &&
						parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) >= 0
				) ??
				utxosInWallet!.find(e => parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) >= 0);
			inputsBatch.push(addedLovelaceUTXO!);
			utxosInWallet = utxosInWallet!.filter(
				e => e.txHash != addedLovelaceUTXO!.txHash || e.outputIndex != addedLovelaceUTXO!.outputIndex
			);

			while (lovelaceInputSum(inputsBatch) < 250000000 && lovelaceInputSum(utxosInWallet) > 0) {
				addedLovelaceUTXO =
					utxosInWallet!.find(
						e =>
							e.asset.find(a => a.unit == POLICY_STRING) &&
							parseInt(e.asset.find(a => a.unit == POLICY_STRING)!.quantity) >= 10000000
					) ??
					utxosInWallet!.find(
						e =>
							e.asset.find(a => a.unit == POLICY_STRING) &&
							parseInt(e.asset.find(a => a.unit == POLICY_STRING)!.quantity) >= 0
					) ??
					utxosInWallet!.find(
						e => parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) >= 248000000
					) ??
					utxosInWallet!.find(e => parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) >= 0);
				inputsBatch.push(addedLovelaceUTXO!);
				utxosInWallet = utxosInWallet.filter(
					e => e.txHash != addedLovelaceUTXO!.txHash || e.outputIndex != addedLovelaceUTXO!.outputIndex
				);
			}
			let smallUTXO = utxosInWallet!.find(
				e => parseInt(e.asset.find(a => a.unit == 'lovelace')!.quantity) < 248000000
			);
			if (smallUTXO) {
				inputsBatch.push(smallUTXO);
				utxosInWallet = utxosInWallet.filter(
					e => e.txHash != smallUTXO!.txHash || e.outputIndex != smallUTXO!.outputIndex
				);
			}
		}
		let workerBench: AirdropBatch = {
			txInputs: inputsBatch,
			txOutputs: element,
			isProcessing: false,
			index: 0,
			txHash: null,
		};
		inputOutputBatch.push(workerBench);
	});
	return inputOutputBatch;
};
