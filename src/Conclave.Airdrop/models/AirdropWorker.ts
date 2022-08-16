import {
    AirdropBatch,
    AirdropWorkerParameter,
    AirdropWorkerResponse,
    ProtocolParametersResponse,
} from '../types/response-types';
import { Worker } from 'worker_threads';
import AirdropStatus from '../enums/airdrop-status';
import AirdropTransactionStatus from '../enums/airdrop-transaction-status';
import { getAllRewards, updateRewardListStatusAsync } from '../utils/reward-utils';
import { ConsoleWithWorkerId } from '../utils/worker-utils';
import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';

const consoleWithMainThread = new ConsoleWithWorkerId('MAIN_THREAD');
export default class AirdropWorker extends Worker {
    public isAvailable: boolean = true;

    constructor() {
        super('./worker.ts');
        this.initEventListeners();
    }

    private initEventListeners(): void {
        this.on('message', async ({ status, txHashString, batch, message }: AirdropWorkerResponse) => {
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
        });
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
        this.postMessage(workerParameter);
    }
}
