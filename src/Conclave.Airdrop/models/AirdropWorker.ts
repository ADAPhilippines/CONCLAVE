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

// failed
// success

export default class AirdropWorker extends Worker {
	public isAvailable: boolean = true;

	constructor() {
		super('./worker.js');
		this.initEventListeners();
	}

	private initEventListeners(): void {
		this.on('message', ({ status, txHashString, batch }: AirdropWorkerResponse) => {
			this.isAvailable = true;
			let airdropStatus: number;

			switch (status) {
				case AirdropTransactionStatus.Failed:
					console.log(`Reverting rewards list status for batch #${batch.index} to New`);
					airdropStatus = AirdropStatus.New;
					break;
				case AirdropTransactionStatus.Success:
					console.log(`Updating rewards list status for batch #${batch.index} to Complete`);
					airdropStatus = AirdropStatus.Completed;
					break;
				default:
					throw new Error('Invalid Airdrop Transaction Status!');
			}

			// if (airdropStatus === AirdropStatus.New || airdropStatus === AirdropStatus.Completed) {
			// 	var rewards = getAllRewards(batch.txOutputs);
			// 	updateRewardListStatusAsync(rewards, airdropStatus, txHashString);
			// }
		});
	}

	public execute(batch: AirdropBatch, protocolParameter: ProtocolParametersResponse): void {
		this.isAvailable = false;
		let workerParameter: AirdropWorkerParameter = {
			batch,
			protocolParameter,
		};
		this.postMessage(workerParameter);
	}
}
