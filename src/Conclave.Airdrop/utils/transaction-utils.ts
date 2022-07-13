import { BlockfrostServerError } from '@blockfrost/blockfrost-js';
import {
    ProtocolParametersResponse,
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
import { getWorkerBatches } from './txBody/txInput-utils';
import { sendTransactionAsync } from './airdrop-utils';

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
    index: number,
    action: string = 'reward') => {
    let randomInterval = parseInt((10000 * Math.random()).toFixed());

    const sendTransaction = setInterval(async () => {
        let submittedUTXOs: Array<TxBodyInput> = [];
        let airdroppedAccounts: Array<PendingReward> = [];
        randomInterval = parseInt((10000 * Math.random()).toFixed());

        try {
            // const res = await blockfrostAPI.blocksLatestTxsAll();
            const res = await blockfrostAPI.txSubmit(transaction!.to_bytes());
            if (res) {
                console.log(`Transaction successfully submitted for Tx ` + toHex(txHash.to_bytes()) + "of index #" + index + " at random interval " + randomInterval);
            }
            submittedUTXOs.push(...txItem.txInputs);
            airdroppedAccounts.push(...txItem.txOutputs);
            //update status in database
            await awaitChangeInUTXOAsync(txHash, transaction, txItem, index, action);
            clearTimeout(sendTransaction);
        } catch (error) {
            if (error instanceof BlockfrostServerError && error.status_code === 400) {
                console.log(`Transaction rejected for Tx ` + toHex(txHash.to_bytes()) + "...retrying");
                console.log(error.message);
            }
            clearTimeout(sendTransaction);
        }
    }, randomInterval);

    setTimeout(() => {
        clearInterval(sendTransaction);
        //update status in database to failed
    }, 180000);
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
    action: string = 'reward'): Promise<void> => {
    let randomInterval = parseInt((10000 * Math.random()).toFixed());

    var checkConfirmation = setInterval(async () => {
        let latestBlock = await blockfrostAPI.blocksLatest();
        randomInterval = parseInt((10000 * Math.random()).toFixed());

        if (!isNull(latestBlock.slot)) {
            if (((400 - (maxSlot - latestBlock.slot!)) / 400) * 100 <= 100 && ((400 - (maxSlot - latestBlock.slot!)) / 400) * 100 >= 0) {
                console.log("Waiting for confirmation for transaction " + toHex(txHash.to_bytes()) + ' ' + "(" + (((400 - (maxSlot - latestBlock.slot!)) / 400) * 100).toFixed(2) + '%' + ")");
            }
            let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
            let commonHash = utxos.find(u => u.tx_hash === toHex(txHash.to_bytes()));
            if (isUndefined(commonHash)) {
                console.log("Transaction Failed");
                clearInterval(checkConfirmation);
                return;
            }

            if (latestBlock.slot! >= maxSlot) {
                if (action === 'divide') {
                    console.log("Divide Transaction Confirmed for " + toHex(txHash.to_bytes()));
                    //add transaction submission functionality
                    await airdropTransaction();
                } else {
                    console.log("Transaction Confirmed for " + toHex(txHash.to_bytes()));
                }
                clearInterval(checkConfirmation);
                return;
            }
        }
    }, 35000 + randomInterval);
}

export const airdropTransaction = async () => {
    await displayUTXOs();
    //1 divide large utxos
    //2 get Output Batches
    //3 get Input Batches
    //4 combine input output batch
    //4 create reward transaction
    //5 submit
    // await divideUTXOsAsync();
    let InputOutputBatches: Array<WorkerBatch> = await getWorkerBatches();

    InputOutputBatches.splice(0,10).forEach(async (batch, index) => {
        //create worker
        sendTransactionAsync(batch.txInputs, batch.txOutputs, index);
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