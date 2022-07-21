import { blockfrostAPI } from '../../config/network.config';
import { policyStr, shelleyChangeAddress } from '../../config/walletKeys.config';
import AirdropTransactionStatus from '../../enums/airdrop-transaction-status';
import { ProtocolParametersResponse, TxBodyInput, UTXO } from '../../types/response-types';
import { isNull } from '../boolean-utils';
import { coinSelectionAsync } from '../coin-utils';
import { toHex } from '../string-utils';
import { conclaveOutputSum, getInputAssetUTXOSum, lovelaceOutputSum } from '../sum-utils';
import {
	createAndSignRewardTxAsync,
	displayUTXOs,
	submitTransactionAsync,
	transactionConfirmation,
} from '../transaction-utils';
import { awaitChangeInUTXOAsync, partitionUTXOs, queryAllUTXOsAsync } from '../utxo-utils';

export const divideUTXOsAsync = async (
	utxos: UTXO | null = null,
	threshold: number,
	protocolParameter: ProtocolParametersResponse
) => {
	await displayUTXOs(utxos!);
	console.log('<-----Dividing UTXOs----->');
	if (isNull(utxos)) return;

	let rewards = partitionUTXOs(utxos!, threshold);
	if (rewards === null || rewards.txInputs === null || rewards.txOutputs === null)
		return console.log('No UTXOs to divide');

	let txInputOutputs = await coinSelectionAsync(rewards.txInputs, rewards.txOutputs, 'random', protocolParameter);
	if (txInputOutputs == null || txInputOutputs === undefined) return;

	console.log('<-----Details----->');
	txInputOutputs?.txInputs.forEach((e, i) => {
		console.log(
			'Txinput #' +
				i +
				' ' +
				e.txHash +
				' ' +
				e.asset.find(f => f.unit == 'lovelace')!.quantity +
				' ' +
				e.asset.find(f => f.unit == 'lovelace')!.unit
		);
	});
	console.log('TxInputLovelace sum: ' + getInputAssetUTXOSum(txInputOutputs!.txInputs));
	console.log('TxInputConclave sum: ' + getInputAssetUTXOSum(txInputOutputs!.txInputs, policyStr));
	console.log('ConclaveOutput sum: ' + conclaveOutputSum(txInputOutputs!.txOutputs));
	console.log('LovelaceOutput sum: ' + lovelaceOutputSum(txInputOutputs!.txOutputs));
	console.log('TxOutput count: ' + txInputOutputs!.txOutputs.length);
	console.log('<-----End of UTXO Divider Details----->');

	let transaction = await createAndSignRewardTxAsync(txInputOutputs, protocolParameter);
	if (transaction == null) return;

	console.log('Dividing Large UTXOs');
	console.log(
		'Transaction ' + toHex(transaction.txHash.to_bytes()) + ' fee ' + transaction.transaction.body().fee().to_str()
	);

	//Submit Transaction

	let txHashString = toHex(transaction.txHash.to_bytes());
	let MAX_NUMBER_OF_RETRIES = 40;
	let retryCount = 0;
	let submitResult: { status: number; message: string; txHashString: string };
	let updateResult: { status: number; message: string; txHashString: string };

	while (retryCount < MAX_NUMBER_OF_RETRIES) {
		submitResult = await submitTransactionAsync(blockfrostAPI, transaction!.transaction, txHashString);
		console.log('Submit Result: ' + submitResult.status + ' ' + submitResult.message);
		if (submitResult.status != AirdropTransactionStatus.Success) {
			retryCount++;
			continue;
		}
		updateResult = await awaitChangeInUTXOAsync(blockfrostAPI, txHashString);
		console.log('Update Result: ' + updateResult.status + ' ' + updateResult.message);
		if (updateResult.status != AirdropTransactionStatus.Success) {
			retryCount++;
			continue;
		} else {
			break;
		}
	}
	if (submitResult!.status != AirdropTransactionStatus.Success) {
		return;
	}
	if (updateResult!.status != AirdropTransactionStatus.Success) {
		return;
	}

	await transactionConfirmation(blockfrostAPI, txHashString);
};
