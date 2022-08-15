import { POLICY_STRING, SHELLEY_CHANGE_ADDRESS } from '../../config/walletKeys.config';
import AirdropTransactionStatus from '../../enums/airdrop-transaction-status';
import { ProtocolParametersResponse } from '../../types/response-types';
import { isNull } from '../boolean-utils';
import { toHex } from '../string-utils';
import { conclaveOutputSum, getInputAssetUTXOSum, lovelaceOutputSum } from '../sum-utils';
import { coinSelectionAsync, createAndSignTxAsync, submitTransactionAsync, transactionConfirmation } from '../transaction-utils';
import { partitionUTXOs, queryAllUTXOsAsync } from '../utxo-utils';

export const divideUTXOsAsync = async (
	protocolParameter: ProtocolParametersResponse,
	lovelaceThreshold: number = 500_000_000,
	conclaveThreshold: number = 200_000_000
) => {
	let utxos = await queryAllUTXOsAsync(SHELLEY_CHANGE_ADDRESS.to_bech32());

	console.log('Dividing UTXOs...');
	if (isNull(utxos)) return;

	let rewards = partitionUTXOs(utxos!, lovelaceThreshold, conclaveThreshold);
	if (rewards === null || rewards.txInputs === null || rewards.txOutputs === null)
		return console.log('No UTXOs to divide. Proceeding to sending transaction.');

	let txInputOutputs = await coinSelectionAsync(rewards.txInputs, rewards.txOutputs, protocolParameter);
	if (txInputOutputs == null || txInputOutputs === undefined) return;

	console.log('<-----Details Divider Details----->');
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
	console.log('TxInputConclave sum: ' + getInputAssetUTXOSum(txInputOutputs!.txInputs, POLICY_STRING));
	console.log('ConclaveOutput sum: ' + conclaveOutputSum(txInputOutputs!.txOutputs));
	console.log('LovelaceOutput sum: ' + lovelaceOutputSum(txInputOutputs!.txOutputs));
	console.log('TxOutput count: ' + txInputOutputs!.txOutputs.length);
	console.log('<-----End of UTXO Divider Details----->');

	let transaction = await createAndSignTxAsync(txInputOutputs, protocolParameter);
	if (transaction == null) return;

	console.log('Dividing Large UTXOs');
	console.log('Transaction ' + toHex(transaction.txHash.to_bytes()) + ' fee ' + transaction.transaction.body().fee().to_str());

	//Submit Transaction
	let txHashString = toHex(transaction.txHash.to_bytes());

	let submitResult = await submitTransactionAsync(transaction!.transaction, txHashString);
	if (submitResult!.status != AirdropTransactionStatus.Success) {
		return;
	}

	await transactionConfirmation(txHashString, 20);
	return;
};
