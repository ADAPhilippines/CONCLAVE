import { AirdropBatch } from '../types/response-types';
import AirdropWorker from './AirdropWorker';

export default class ConclaveAirdropper {
    private airdropWorkers: AirdropWorker[] = [];
    private maxWorkers: number = 0;

    constructor(maxWorkers: number = 5) {
        this.maxWorkers = maxWorkers;
        this.initAirdropWorkers();
    }

    private initAirdropWorkers(): AirdropWorker[] {
        for (let i = 0; i < this.maxWorkers; i++) {
            this.airdropWorkers.push(new AirdropWorker(i + 1));
        }

        return this.airdropWorkers;
    }

    public getAirdropWorkers(): AirdropWorker[] {
        return this.airdropWorkers;
    }

    public getFirstAvailableWorker(): AirdropWorker | null {
        for (let airdropWorker of this.airdropWorkers) {
            if (airdropWorker.isAvailable) return airdropWorker;
        }
        return null;
    }
}
