import { blockfrostAPI } from "../../config/network.config";
import { policyStr, shelleyChangeAddress } from "../../config/walletKeys.config";
import { TxBodyInput, UTXO } from "../../types/response-types";
import { isNull } from "../boolean-utils";
import { coinSelectionAsync } from "../coin-utils";
import { toHex } from "../string-utils";
import { conclaveOutputSum, getInputAssetUTXOSum, lovelaceOutputSum } from "../sum-utils";
import { createAndSignRewardTxAsync, displayUTXOs, submitTransactionAsync } from "../transaction-utils";
import { partitionUTXOs, queryAllUTXOsAsync } from "../utxo-utils";

export const divideUTXOsAsync = async (utxos: UTXO | null = null) => {
    await displayUTXOs();
    console.log("<-----Dividing UTXOs----->")
    if (isNull(utxos)) return;

    let rewards = partitionUTXOs(utxos!);
    if (rewards?.txInputs === null || rewards?.txOutputs === null || rewards === null) return;
    
    let txInputOutputs = await coinSelectionAsync(rewards.txInputs, rewards.txOutputs, 0);
    if (txInputOutputs == null || txInputOutputs === undefined) return;

    console.log('<-----Details----->');
    txInputOutputs?.txInputs.forEach((e, i) => {
        console.log('Txinput #' + i + " " + e.txHash + ' ' + e.asset.find(f => f.unit == "lovelace")!.quantity + " " + e.asset.find(f => f.unit == "lovelace")!.unit);
    });
    console.log('TxInputLovelace sum: ' + getInputAssetUTXOSum(txInputOutputs!.txInputs));
    console.log('TxInputConclave sum: ' + getInputAssetUTXOSum(txInputOutputs!.txInputs, policyStr))
    console.log('ConclaveOutput sum: ' + conclaveOutputSum(txInputOutputs!.txOutputs));
    console.log('LovelaceOutput sum: ' + lovelaceOutputSum(txInputOutputs!.txOutputs));
    console.log('TxOutput count: ' + txInputOutputs!.txOutputs.length);
    console.log('<-----End of UTXO Divider Details----->');

    let transaction = await createAndSignRewardTxAsync(txInputOutputs);
    if (transaction == null) return;

    console.log('Dividing Large UTXOs');
    console.log('Transaction ' + toHex(transaction.txHash.to_bytes()) + ' fee ' + transaction.transaction.body().fee().to_str());

    //Submit Transaction
    await submitTransactionAsync(transaction.transaction, transaction.txHash, txInputOutputs!, 0, 0);
    return await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
}