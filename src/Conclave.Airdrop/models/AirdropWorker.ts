import {
	AirdropBatch,
	AirdropWorkerParameter,
	AirdropWorkerResponse,
	ProtocolParametersResponse,
} from '../types/response-types';
import { Worker } from 'worker_threads';
import AirdropStatus from '../enums/airdrop-status';
import AirdropTransactionStatus from '../enums/airdrop-transaction-status';

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

			switch (status) {
				case AirdropTransactionStatus.Failed:
					// TODO: update pendingRewards to failed
					break;
				case AirdropTransactionStatus.Success:
					// TODO: update pendingRewards to complete
					break;
				default:
					throw new Error('Invalid Airdrop Transaction Status!');
			}
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
