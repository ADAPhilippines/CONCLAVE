import { AirdropWorkerParameter, RewardTxBodyDetails } from './types/response-types';
import { getAllRewards, updateRewardListStatusAsync } from './utils/reward-utils';
import { isEmpty, isNull, isUndefined } from './utils/boolean-utils';
import {
    getInputAssetUTXOSum,
    getOutputConclaveSum,
    getOutputLovelaceSum,
    lovelaceInputSum,
    lovelaceOutputSum,
} from './utils/sum-utils';
import {
    createAndSignTxAsync,
    submitTransactionAsync,
    transactionConfirmation,
    coinSelectionAsync,
} from './utils/transaction-utils';
import AirdropTransactionStatus from './enums/airdrop-transaction-status';
import { parentPort } from 'worker_threads';
import { toHex } from './utils/string-utils';
import AirdropStatus from './enums/airdrop-status';
import { setTimeout } from 'timers/promises';
import { ConsoleWithWorkerId } from './utils/worker-utils';
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

const { v1: uuidv1 } = require('uuid');

let workerId = uuidv1().substring(0, 5);
export const consoleWithWorkerId = new ConsoleWithWorkerId(workerId);

parentPort?.on(
    'message',
    async ({
        batch,
        protocolParameter,
        policyId,
        signingKey,
        baseAddress,
        assetName,
        blockfrostProjectId,
    }: AirdropWorkerParameter) => {
        let txHashString: string | null;
        let txInputOutputs: RewardTxBodyDetails | null;
        const blockfrostAPI = new BlockFrostAPI({
            projectId: blockfrostProjectId,
        });

        consoleWithWorkerId.log(`Started working on Batch ${batch.index}`);

        if (!batch.isProcessing) {
            txInputOutputs = await coinSelectionAsync(
                blockfrostAPI,
                batch.txInputs,
                batch.txOutputs,
                protocolParameter,
                policyId,
                assetName,
                baseAddress,
                signingKey.to_public()
            );

            if (isNull(txInputOutputs) || isEmpty(txInputOutputs!.txOutputs)) {
                consoleWithWorkerId.log('Ending worker on Batch ' + batch.index);
                return parentPort!.postMessage({
                    status: AirdropTransactionStatus.New,
                    batch: batch,
                    txHashString: '',
                    message: 'Batch Error: Not enough funds',
                });
            }
            batch.txOutputs = txInputOutputs!.txOutputs;

            let txInputStrings: string = '';
            let otherDetails: string =
                'Currently working on Batch#' +
                batch.index +
                'TxInputLovelace sum: ' +
                getInputAssetUTXOSum(txInputOutputs!.txInputs) +
                '\n' +
                'TxOutputLovelace sum: ' +
                getOutputLovelaceSum(txInputOutputs!.txOutputs) +
                '\n' +
                'TxInputConclave sum: ' +
                getInputAssetUTXOSum(txInputOutputs!.txInputs, policyId) +
                '\n' +
                'TxOutputConclave sum: ' +
                getOutputConclaveSum(txInputOutputs!.txOutputs) +
                '\n' +
                '<========End of Details for Worker#' +
                workerId +
                ' ========>';
            txInputOutputs!.txInputs.forEach((e, i) => {
                txInputStrings += `Txinput #${i} ${e.txHash} ${e.outputIndex} ${
                    e.asset.find((f) => f.unit == 'lovelace')!.quantity
                } ${e.asset.find((f) => f.unit == 'lovelace')!.unit} ${
                    e.asset.find((f) => f.unit != 'lovelace') ? e.asset.find((f) => f.unit != 'lovelace')?.quantity : ''
                } ${e.asset.find((f) => f.unit != 'lovelace') ? 'conclave' : ''}\n`;
            });
            consoleWithWorkerId.log(
                '\n<========Details for Worker' + ' ========>\n' + `${txInputStrings}` + `${otherDetails}`
            );
            console.log();

            let transaction = await createAndSignTxAsync(
                blockfrostAPI,
                txInputOutputs!,
                protocolParameter,
                signingKey,
                baseAddress,
                policyId,
                assetName
            );
            if (isNull(transaction)) {
                consoleWithWorkerId.log('Ending worker on Batch ' + batch.index);
                return parentPort!.postMessage({
                    status: AirdropTransactionStatus.New,
                    batch: batch,
                    txHashString: '',
                    message: 'Transaction Error: Failed to create transaction',
                });
            }

            txHashString = toHex(transaction!.txHash.to_bytes());
            consoleWithWorkerId.log(
                'Transaction hash' +
                    ' ' +
                    toHex(transaction!.txHash.to_bytes()) +
                    ' fee ' +
                    transaction!.transaction.body().fee().to_str()
            );

            consoleWithWorkerId.log('Updating airdrop status to InProgress for batch#' + batch.index);
            await updateRewardListStatusAsync(
                getAllRewards(txInputOutputs!.txOutputs),
                AirdropStatus.InProgress,
                txHashString
            );

            // let submitResult = await submitTransactionAsync(transaction!.transaction, txHashString);
            // if (submitResult!.status != AirdropTransactionStatus.Success) {
            // 	let randomInterval = 5000 * Math.floor(Math.random());
            // 	await setTimeout(randomInterval + 3000);
            // 	return parentPort!.postMessage({
            // 		...submitResult,
            // 		batch: workerparameter.batch,
            // 	});
            // }
        } else {
            //skip coin selection and submit transaction
            txHashString = batch.txHash;
            consoleWithWorkerId.log('Skipping coin selection for txhash ' + txHashString + '...');
            consoleWithWorkerId.log('Starting tx confirmation for txhash ' + txHashString + '...');
        }

        let confirmationResult = await transactionConfirmation(blockfrostAPI, txHashString!, 20 /*confirmationCount*/);
        if (confirmationResult!.status != AirdropTransactionStatus.Success && batch.isProcessing === true) {
            confirmationResult.txHashString = '';
        }
        return parentPort!.postMessage({
            ...confirmationResult,
            batch,
        });
    }
);
