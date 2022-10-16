import {
    AirdropBatch,
    AirdropWorkerParameter,
    AirdropWorkerResponse,
    ProtocolParametersResponse,
    RewardTxBodyDetails,
} from '../types/response-types';
import AirdropStatus from '../enums/airdrop-status';
import AirdropTransactionStatus from '../enums/airdrop-transaction-status';
import { getAllRewards, updateRewardListStatusAsync } from '../utils/reward-utils';
import { ConsoleWithWorkerId } from '../utils/worker-utils';
import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';

import { isEmpty, isNull, isUndefined } from '../utils/boolean-utils';
import {
    getInputAssetUTXOSum,
    getOutputConclaveSum,
    getOutputLovelaceSum,
    lovelaceInputSum,
    lovelaceOutputSum,
} from '../utils/sum-utils';
import {
    createAndSignTxAsync,
    submitTransactionAsync,
    transactionConfirmation,
    coinSelectionAsync,
} from '../utils/transaction-utils';
import { toHex } from '../utils/string-utils';
import { setTimeout } from 'timers/promises';
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

const consoleWithMainThread = new ConsoleWithWorkerId('MAIN_THREAD');
export default class AirdropWorker {
    public isAvailable: boolean = true;
    public workerNumber: number = 0;
    public consoleId: ConsoleWithWorkerId;

    constructor(workerNumber: number) {
        this.workerNumber = workerNumber;
        this.consoleId = new ConsoleWithWorkerId(workerNumber.toString());
    }

    private async onEvent({ status, txHashString, batch, message }: AirdropWorkerResponse): Promise<void> {
        this.isAvailable = true;
        let airdropStatus: number = AirdropStatus.Skip;

        switch (status) {
            case AirdropTransactionStatus.Failed:
                consoleWithMainThread.log(`Reverting rewards list status for batch #${batch.index} to New`);
                airdropStatus = AirdropStatus.New;
                break;
            case AirdropTransactionStatus.Success:
                consoleWithMainThread.log(`Updating rewards list status for batch #${batch.index} to Complete`);
                airdropStatus = AirdropStatus.Completed;
                break;
            case AirdropTransactionStatus.New:
                break;
            default:
                throw new Error('Invalid Airdrop Transaction Status!');
        }

        consoleWithMainThread.log(`${message} ${txHashString === '' ? '' : `txHash: ${txHashString}`}`);
        if (airdropStatus === AirdropStatus.New || airdropStatus === AirdropStatus.Completed) {
            var rewards = getAllRewards(batch.txOutputs);
            await updateRewardListStatusAsync(rewards, airdropStatus, txHashString);
        }
    }

    public execute(
        batch: AirdropBatch,
        protocolParameter: ProtocolParametersResponse,
        policyId: string,
        assetName: string,
        baseAddress: CardanoWasm.Address,
        signingKey: CardanoWasm.PrivateKey,
        blockfrostProjectId: string
    ): void {
        this.isAvailable = false;
        let workerParameter: AirdropWorkerParameter = {
            batch,
            protocolParameter,
            policyId,
            assetName,
            baseAddress,
            signingKey,
            blockfrostProjectId,
        };
        this.doWork(workerParameter);
    }

    public async doWork({
        batch,
        protocolParameter,
        policyId,
        signingKey,
        baseAddress,
        assetName,
        blockfrostProjectId,
    }: AirdropWorkerParameter): Promise<void> {
        let txHashString: string | null;
        let txInputOutputs: RewardTxBodyDetails | null;
        const blockfrostAPI = new BlockFrostAPI({
            projectId: blockfrostProjectId,
        });

        console.log(`WORKER: ${this.workerNumber}: Started working on Batch ${batch.index}`);

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
                console.log(`WORKER: ${this.workerNumber}: Ending worker on Batch ${batch.index}`);
                return this.onEvent({
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
                this.workerNumber +
                ' ========>';
            txInputOutputs!.txInputs.forEach((e, i) => {
                txInputStrings += `Txinput #${i} ${e.txHash} ${e.outputIndex} ${
                    e.asset.find((f) => f.unit == 'lovelace')!.quantity
                } ${e.asset.find((f) => f.unit == 'lovelace')!.unit} ${
                    e.asset.find((f) => f.unit != 'lovelace') ? e.asset.find((f) => f.unit != 'lovelace')?.quantity : ''
                } ${e.asset.find((f) => f.unit != 'lovelace') ? 'conclave' : ''}\n`;
            });
            console.log(
                `\nWORKER ${this.workerNumber}: <========Details for Worker' + ' ========>\n ${txInputStrings} ${otherDetails}`
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
                console.log(`WORKER ${this.workerNumber}: Ending worker on Batch ${batch.index}`);
                return this.onEvent({
                    status: AirdropTransactionStatus.New,
                    batch: batch,
                    txHashString: '',
                    message: 'Transaction Error: Failed to create transaction',
                });
            }

            txHashString = toHex(transaction!.txHash.to_bytes());
            console.log(
                `WORKER ${this.workerNumber}: ` +
                    'Transaction hash' +
                    ' ' +
                    toHex(transaction!.txHash.to_bytes()) +
                    ' fee ' +
                    transaction!.transaction.body().fee().to_str()
            );

            console.log(
                `WORKER ${this.workerNumber}: ` + 'Updating airdrop status to InProgress for batch#' + batch.index
            );
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
            console.log(`WORKER ${this.workerNumber}: ` + 'Skipping coin selection for txhash ' + txHashString + '...');
            console.log(
                `WORKER ${this.workerNumber}: ` + 'Starting tx confirmation for txhash ' + txHashString + '...'
            );
        }

        let confirmationResult = await transactionConfirmation(blockfrostAPI, txHashString!, 20 /*confirmationCount*/);
        if (confirmationResult!.status != AirdropTransactionStatus.Success && batch.isProcessing === true) {
            confirmationResult.txHashString = '';
        }
        return this.onEvent({
            ...confirmationResult,
            batch,
        });
    }
}
