import { BlockfrostServerError } from '@blockfrost/blockfrost-js';
import {
    ProtocolParametersResponse,
    RewardTxBodyDetails,
    TxBodyInput
} from '../types/response-types';
import CardanoWasm, { TransactionBuilder } from '@dcspark/cardano-multiplatform-lib-nodejs';
import { fromHex, toHex } from './string-utils';
import { createRewardTxBodyAsync } from './txBody/txBody-utils';
import { awaitChangeInUTXOAsync, queryAllUTXOsAsync } from './utxo-utils';
import { isNull, isUndefined } from './boolean-utils';
import { Reward } from '../types/database-types';
import { blockfrostAPI } from '../config/network.config';
import { privKey, shelleyChangeAddress } from '../config/walletKeys.config';
import { PendingReward } from '../types/helper-types';

export const setTTLAsync = async (): Promise<number> => {
    const latestBlock = await blockfrostAPI.blocksLatest();
    const currentSlot = latestBlock.slot;

    return currentSlot! + 20 * 20; //after 20 blocks
}

export const signTxBody = (
    txHash: CardanoWasm.TransactionHash,
    txBody: CardanoWasm.TransactionBody,
    signKey: CardanoWasm.PrivateKey
): CardanoWasm.Transaction | null => {
    try {
        const witnesses = CardanoWasm.TransactionWitnessSet.new();
        const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
        const vkeyWitness = CardanoWasm.make_vkey_witness(txHash, signKey);
        vkeyWitnesses.add(vkeyWitness);
        witnesses.set_vkeys(vkeyWitnesses);

        const transaction = createTxBody(txBody, witnesses);

        return transaction;
    } catch (error) {
        console.log('Error Signing Transaction body ' + error);
        return null;
    }
}

export const createTxBody = (
    txBody: CardanoWasm.TransactionBody,
    witnesses: CardanoWasm.TransactionWitnessSet
): CardanoWasm.Transaction | null => {
    try {
        const transaction = CardanoWasm.Transaction.new(txBody, witnesses);
        return transaction;
    } catch (error) {
        console.log('Error Creating Transaction body ' + error);
        return null;
    }
}

export const submitTransactionAsync = async (
    transaction: CardanoWasm.Transaction,
    txHash: CardanoWasm.TransactionHash,
    txItem: RewardTxBodyDetails,
    index: number) => {
    let randomInterval = parseInt((10000 * Math.random()).toFixed());

    const sendTransaction = setTimeout(async () => {
        let submittedUTXOs: Array<TxBodyInput> = [];
        let airdroppedAccounts: Array<PendingReward> = [];
        try {
            // const res = await blockfrostAPI.blocksLatestTxsAll();
            const res = await blockfrostAPI.txSubmit(transaction!.to_bytes());
            if (res) {
                console.log(`Transaction successfully submitted for Tx ` + toHex(txHash.to_bytes()) + "of index #" + index + " at random interval " + randomInterval);
            }
            submittedUTXOs.push(...txItem.txInputs);
            airdroppedAccounts.push(...txItem.txOutputs);
            //update status in database
            await awaitChangeInUTXOAsync(txHash);
            clearTimeout(sendTransaction);
        } catch (error) {
            if (error instanceof BlockfrostServerError && error.status_code === 400) {
                console.log(`Transaction rejected for Tx ` + toHex(txHash.to_bytes()));
                console.log(error.message);
            }
            clearTimeout(sendTransaction);
        }
    }, randomInterval);
}

export const createAndSignRewardTxAsync = async (
    txBodyDetails: RewardTxBodyDetails
): Promise<{
    transaction: CardanoWasm.Transaction;
    txHash: CardanoWasm.TransactionHash
} | null> => {
    let txBodyResult = await createRewardTxBodyAsync(txBodyDetails);
    if (txBodyResult == null) return null;

    let txSigned = signTxBody(txBodyResult.txHash, txBodyResult.txBody, privKey);
    if (txSigned == null) return null;

    return { transaction: txSigned, txHash: txBodyResult.txHash };
}

export const waitNumberOfBlocks = async (
    txHash: CardanoWasm.TransactionHash,
    maxSlot: number): Promise<void> => {
    let randomInterval = parseInt((10000 * Math.random()).toFixed());

    var checkConfirmation = setInterval(async () => {
        let latestBlock = await blockfrostAPI.blocksLatest();
        randomInterval = parseInt((10000 * Math.random()).toFixed());

        if (!isNull(latestBlock.slot)) {
            if (((400-(maxSlot-latestBlock.slot!))/400)*100 <= 100 && ((400-(maxSlot-latestBlock.slot!))/400)*100 >= 0) {
                console.log("Waiting for confirmation for transaction " + toHex(txHash.to_bytes()) + ' ' + "(" + (((400-(maxSlot-latestBlock.slot!))/400)*100).toFixed(2) + '%' + ")");
            }
            let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
            let commonHash = utxos.find(u => u.tx_hash === toHex(txHash.to_bytes()));
            if (isUndefined(commonHash)) {
                console.log("Transaction Failed");
                clearInterval(checkConfirmation);
                return;
            }

            if (latestBlock.slot! >= maxSlot) {
                console.log("Transaction Confirmed for " + toHex(txHash.to_bytes()));
                clearInterval(checkConfirmation);
                return;
            }
        }
    }, 40000 + randomInterval);
}