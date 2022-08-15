import AirdropTransactionStatus from '../../enums/airdrop-transaction-status';
import { ProtocolParametersResponse, TxBodyInput, UTXO } from '../../types/response-types';
import { isNull } from '../boolean-utils';
import { toHex } from '../string-utils';
import {
	coinSelectionAsync,
	createAndSignTxAsync,
	submitTransactionAsync,
	transactionConfirmation,
} from '../transaction-utils';
import { displayUTXOs, partitionUTXOs, queryAllUTXOsAsync } from '../utxo-utils';

// export const combineUTXOsAsync = async (
// 	utxos: UTXO | null = null,
// 	threshold: number,
// 	protocolParameter: ProtocolParametersResponse
// ) => {
// 	await displayUTXOs(utxos!);
// 	console.log('<-----Combining UTXOs----->');
// 	if (isNull(utxos)) return;

// 	let rewards = combineUTXOs(utxos!, threshold);
// 	if (rewards === null || rewards.txInputs === null || rewards.txOutputs === null)
// 		return console.log('No UTXOs to divide');

// 	let txInputOutputs = await coinSelectionAsync(rewards.txInputs, rewards.txOutputs, 'random', protocolParameter);
// 	if (txInputOutputs == null || txInputOutputs === undefined) return;

// 	let transaction = await createAndSignTxAsync(txInputOutputs, protocolParameter);
// 	if (transaction == null) return;

// 	console.log('Dividing Large UTXOs');
// 	console.log(
// 		'Transaction ' + toHex(transaction.txHash.to_bytes()) + ' fee ' + transaction.transaction.body().fee().to_str()
// 	);

// 	//Submit Transaction
// 	let txHashString = toHex(transaction.txHash.to_bytes());

// 	let submitResult = await submitTransactionAsync(blockfrostAPI, transaction!.transaction, txHashString);
// 	if (submitResult!.status != AirdropTransactionStatus.Success) return;

// 	await transactionConfirmation(blockfrostAPI, txHashString);
// 	return;
// };
