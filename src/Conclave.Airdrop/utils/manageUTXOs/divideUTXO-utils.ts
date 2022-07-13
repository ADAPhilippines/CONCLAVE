import { blockfrostAPI } from "../../config/network.config";
import { policyStr, shelleyChangeAddress } from "../../config/walletKeys.config";
import { airdropTransaction } from "../../server";
import { TxBodyInput } from "../../types/response-types";
import { isNull } from "../boolean-utils";
import { coinSelectionAsync } from "../coin-utils";
import { toHex } from "../string-utils";
import { conclaveOutputSum, getInputAssetUTXOSum, lovelaceOutputSum } from "../sum-utils";
import { createAndSignRewardTxAsync, submitTransactionAsync, waitNumberOfBlocks } from "../transaction-utils";
import { awaitChangeInUTXOAsync, partitionUTXOs, queryAllUTXOsAsync } from "../utxo-utils";

export const divideUTXOsAsync = async () => {
    console.log('Dividing UTXOs');
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
    if (isNull(utxos)) return airdropTransaction();

    let rewards = partitionUTXOs(utxos);
    if (rewards?.txInputs === null || rewards?.txOutputs === null || rewards === null) return airdropTransaction();

    let txInputOutputs = await coinSelectionAsync(rewards.txInputs, rewards.txOutputs, 0);
    if (txInputOutputs == null || txInputOutputs === undefined) return airdropTransaction();

    console.log('<-----Details----->');
    txInputOutputs?.txInputs.forEach((e, i) => {
        console.log('Txinput #' + i + " " + e.txHash + ' ' + e.asset.find(f => f.unit == "lovelace")!.quantity + " " + e.asset.find(f => f.unit == "lovelace")!.unit);
    });
    console.log('TxInputLovelace sum: ' + getInputAssetUTXOSum(txInputOutputs!.txInputs));
    console.log('TxInputConclave sum: ' + getInputAssetUTXOSum(txInputOutputs!.txInputs, policyStr))
    console.log('ConclaveOutput sum: ' + conclaveOutputSum(txInputOutputs!.txOutputs));
    console.log('LovelaceOutput sum: ' + lovelaceOutputSum(txInputOutputs!.txOutputs));
    console.log('TxOutput count: ' + txInputOutputs!.txOutputs.length);
    console.log(' ');

    let transaction = await createAndSignRewardTxAsync(txInputOutputs);
    if (transaction == null) return airdropTransaction();

    console.log('Dividing Large UTXOs');
    console.log('Transaction ' + toHex(transaction.txHash.to_bytes()) + ' fee ' + transaction.transaction.body().fee().to_str());

    //Submit Transaction
    await submitTransactionAsync(transaction.transaction, transaction.txHash, txInputOutputs!, 0, 'divide');
}
