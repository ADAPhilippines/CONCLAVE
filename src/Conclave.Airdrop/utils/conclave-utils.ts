import { ProtocolParametersResponse } from '../types/response-types';
import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';
import { partitionUTXOs, queryAllUTXOsAsync } from './utxo-utils';
import { isNull } from './boolean-utils';
import {
    coinSelectionAsync,
    createAndSignTxAsync,
    submitTransactionAsync,
    transactionConfirmation,
} from './transaction-utils';
import { conclaveOutputSum, getInputAssetUTXOSum, lovelaceOutputSum } from './sum-utils';
import { toHex } from './string-utils';
import AirdropTransactionStatus from '../enums/airdrop-transaction-status';
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

export const divideUTXOsAsync = async (
    blockfrostAPI: BlockFrostAPI,
    protocolParameter: ProtocolParametersResponse,
    lovelaceThreshold: number = 500_000_000,
    conclaveThreshold: number = 200_000_000,
    policyId: string,
    assetName: string,
    shellyChangeAddress: CardanoWasm.Address,
    signingKey: CardanoWasm.PrivateKey
) => {
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, shellyChangeAddress.to_bech32());

    console.log('Dividing UTXOs...');
    if (isNull(utxos)) return;

    let rewards = partitionUTXOs(utxos!, lovelaceThreshold, conclaveThreshold, policyId, shellyChangeAddress);
    if (rewards === null || rewards.txInputs === null || rewards.txOutputs === null)
        return console.log('No UTXOs to divide. Proceeding to sending transaction.');

    let txInputOutputs = await coinSelectionAsync(
        blockfrostAPI,
        rewards.txInputs,
        rewards.txOutputs,
        protocolParameter,
        policyId,
        assetName,
        shellyChangeAddress,
        signingKey.to_public()
    );
    if (txInputOutputs == null || txInputOutputs === undefined) return;

    console.log('<-----Details Divider Details----->');
    txInputOutputs?.txInputs.forEach((e, i) => {
        console.log(
            'Txinput #' +
                i +
                ' ' +
                e.txHash +
                ' ' +
                e.asset.find((f) => f.unit == 'lovelace')!.quantity +
                ' ' +
                e.asset.find((f) => f.unit == 'lovelace')!.unit
        );
    });
    console.log('TxInputLovelace sum: ' + getInputAssetUTXOSum(txInputOutputs!.txInputs));
    console.log('TxInputConclave sum: ' + getInputAssetUTXOSum(txInputOutputs!.txInputs, policyId));
    console.log('ConclaveOutput sum: ' + conclaveOutputSum(txInputOutputs!.txOutputs));
    console.log('LovelaceOutput sum: ' + lovelaceOutputSum(txInputOutputs!.txOutputs));
    console.log('TxOutput count: ' + txInputOutputs!.txOutputs.length);
    console.log('<-----End of UTXO Divider Details----->');

    let transaction = await createAndSignTxAsync(
        blockfrostAPI,
        txInputOutputs,
        protocolParameter,
        signingKey,
        shellyChangeAddress,
        policyId,
        assetName
    );
    if (transaction == null) return;

    console.log('Dividing Large UTXOs');
    console.log(
        'Transaction ' + toHex(transaction.txHash.to_bytes()) + ' fee ' + transaction.transaction.body().fee().to_str()
    );

    //Submit Transaction
    let txHashString = toHex(transaction.txHash.to_bytes());

    let submitResult = await submitTransactionAsync(blockfrostAPI, transaction!.transaction, txHashString);
    if (submitResult!.status != AirdropTransactionStatus.Success) {
        return;
    }

    await transactionConfirmation(blockfrostAPI, txHashString, 20);
    return;
};
