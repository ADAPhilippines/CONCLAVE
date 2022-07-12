import { blockfrostAPI } from "../config/network.config";
import { policyStr, shelleyChangeAddress } from "../config/walletKeys.config";
import { Reward } from "../types/database-types";
import { PendingReward } from "../types/helper-types";
import { CardanoAssetResponse, TxBodyInput } from "../types/response-types";
import { isEmpty, isNull, isUndefined } from "./boolean-utils";
import { coinSelectionAsync } from "./coin-utils";
import { toHex } from "./string-utils";
import { conclaveOutputSum, getInputAssetUTXOSum, getOutputConclaveSum, getOutputLovelaceSum, lovelaceOutputSum } from "./sum-utils";
import {
    createAndSignRewardTxAsync,
    submitTransactionAsync
} from "./transaction-utils";
import { queryAllUTXOsAsync } from "./utxo-utils";

export const getRawUTXOAssetAsync = async (unit: string = "lovelace"): Promise<Array<TxBodyInput>> => {
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
    let txBodyInputs: Array<TxBodyInput> = [];
    utxos = utxos.filter(utxo => (unit == "lovelace" ? utxo.amount.length == 1 : utxo.amount.length >= 1) && utxo.amount.find(asset => asset.unit == unit));

    utxos.forEach((utxo) => {
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
}

export const getAllUTXOsAsync = async (): Promise<Array<TxBodyInput>> => {
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
    let txBodyInputs: Array<TxBodyInput> = [];

    utxos.forEach((utxo) => {
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
}

export const sendTransactionAsync = async (txInputBatch: Array<TxBodyInput>, txOutputBatch: Array<PendingReward>, index: number) => {
    console.log("<========Creating TxBody for Worker #" + index + " ========>");
    let txInputOutputs = await coinSelectionAsync(txInputBatch, txOutputBatch, index);
    if (isNull(txInputOutputs)) return;

    txInputOutputs?.txInputs.forEach((e, i) => {
        console.log('Txinput #' + i + " " + e.txHash + ' ' + e.asset.find(f => f.unit == "lovelace")!.quantity + " " + e.asset.find(f => f.unit == "lovelace")!.unit + " " + e.asset.find(f => f.unit != "lovelace")?.quantity);
    });

    console.log("<========Details for Worker #" + index + " ========> \n" +
        'TxInputLovelace sum: ' + getInputAssetUTXOSum(txInputOutputs!.txInputs) + "\n" +
        'TxOutputLovelace sum: ' + getOutputLovelaceSum(txInputOutputs!.txOutputs) + "\n" +
        'TxInputConclave sum: ' + getInputAssetUTXOSum(txInputOutputs!.txInputs, policyStr) + "\n" +
        'TxOutputConclave sum: ' + getOutputConclaveSum(txInputOutputs!.txOutputs) + "\n" +
        "<========End for Worker #" + index + " ========>");

    let transaction = await createAndSignRewardTxAsync(txInputOutputs!);
    if (transaction == null) return;

    console.log('Transaction #' + index + " " + toHex(transaction.txHash.to_bytes()) + ' fee ' + transaction.transaction.body().fee().to_str());

    await submitTransactionAsync(transaction.transaction, transaction.txHash, txInputOutputs!, index);
}

