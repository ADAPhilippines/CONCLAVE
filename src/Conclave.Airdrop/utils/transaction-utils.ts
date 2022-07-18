import { BlockfrostServerError } from '@blockfrost/blockfrost-js';
import {
    RewardTxBodyDetails,
    TxBodyInput,
    WorkerBatch
} from '../types/response-types';
import CardanoWasm, { TransactionBuilder } from '@dcspark/cardano-multiplatform-lib-nodejs';
import { fromHex, toHex } from './string-utils';
import { createRewardTxBodyAsync } from './txBody/txBody-utils';
import { awaitChangeInUTXOAsync, queryAllUTXOsAsync } from './utxo-utils';
import { isNull, isUndefined } from './boolean-utils';
import { blockfrostAPI } from '../config/network.config';
import { privKey, shelleyChangeAddress } from '../config/walletKeys.config';
import { PendingReward } from '../types/helper-types';
import { getBatchesPerWorker } from './txBody/txInput-utils';
import { setTimeout } from 'timers/promises';

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
    worker: number,
    index: number) : Promise<{currentIndex: number, status: string}> => {
    
    for (let i = 0; i < 30; i++) {
        let submittedUTXOs: Array<TxBodyInput> = [];
        let airdroppedAccounts: Array<PendingReward> = [];
        let randomInterval = parseInt((5000 * Math.random()).toFixed());
        await setTimeout(1000 + randomInterval);

        try {
            const res = await blockfrostAPI.txSubmit(transaction!.to_bytes());
            if (res) {
                console.log('WORKER# ' + worker + `: Transaction successfully submitted for Tx ` + toHex(txHash.to_bytes()) + " of worker #" + worker + " at random interval " + randomInterval);
            }

            submittedUTXOs.push(...txItem.txInputs);
            airdroppedAccounts.push(...txItem.txOutputs);

            // parentPort?.postMessage({currentIndex: index, status: "in progress"});
            return await awaitChangeInUTXOAsync(txHash, transaction, txItem, worker, index);
        } catch (error) {
            if (error instanceof BlockfrostServerError && error.status_code === 400) {
                console.log(error.message);
            }
            console.log('WORKER# ' + worker + `: Transaction rejected for Tx ` + toHex(txHash.to_bytes()) + "...retrying");
        }
    }
    return {currentIndex: index, status: "failed"};
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
    maxSlot: number,
    worker: number,
    index: number) : Promise<{currentIndex: number, status: string}> => {
        
    for (let i = 0; i < 100; i++) {
        let randomInterval = parseInt((10000 * Math.random()).toFixed());
        try {
            let latestBlock = await blockfrostAPI.blocksLatest();

            if (!isNull(latestBlock.slot)) {
                if (((400 - (maxSlot - latestBlock.slot!)) / 400) * 100 <= 100 && ((400 - (maxSlot - latestBlock.slot!)) / 400) * 100 >= 0) {
                    console.log('WORKER# ' + worker + " " + "Waiting for confirmation for transaction " + toHex(txHash.to_bytes()) + ' ' + "(" + (((400 - (maxSlot - latestBlock.slot!)) / 400) * 100).toFixed(2) + '%' + ")");
                }
                let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
                let commonHash = utxos.find(u => u.tx_hash === toHex(txHash.to_bytes()));
                if (isUndefined(commonHash)) {
                    console.log('WORKER# ' + worker + " " + "Transaction Failed for " + toHex(txHash.to_bytes()));
                    break;
                }
    
                if (latestBlock.slot! >= maxSlot) {
                    console.log('WORKER# ' + worker + " "+ "Transaction Confirmed for " + toHex(txHash.to_bytes()));
                    return {currentIndex: index, status: "confirmed"}; 
                }
            }
        } catch (error) {
            console.log(error);
        };

        await setTimeout(40000 + randomInterval);
    }

    return {currentIndex: index, status: "failed"}; 
}

export const airdropTransaction = async () => {
    await displayUTXOs();

    let InputOutputBatches: Array<WorkerBatch> = await getBatchesPerWorker();

    InputOutputBatches.splice(0,10).forEach(async (batch, index) => {
        const worker = new Worker("./worker.js");
        
        worker.postMessage({batch: batch, index: index});
    });
}

export const displayUTXOs = async () => {
    console.log("Displaying All Available utxos");
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
    let displayUTXO: Array<displayUTXO> = [];

    utxos.forEach((utxo) => {
        let assetArray: Array<string> = [];
        utxo.amount.forEach((asset) => {
            assetArray.push(asset.quantity + " " + asset.unit);
        })

        displayUTXO.push({
            txHash: utxo.tx_hash,
            outputIndex: utxo.output_index.toString(),
            assets: assetArray.join(" + "),
        });
    });

    console.table(displayUTXO);
    console.log(" ");
    console.log(" ");
}

type displayUTXO = {
    txHash: string;
    outputIndex: string;
    assets: string;
}