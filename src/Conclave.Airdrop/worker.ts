import { sendTransactionAsync } from "./utils/airdrop-utils";
import { parentPort } from "worker_threads";
import { WorkerBatch } from "./types/response-types";

parentPort!.on("message", async (data : { batch: Int32Array, currentIndex: number, worker: number, workerbatches: Array<WorkerBatch> }) => { 
    if (data.currentIndex >= data.workerbatches.length) {
        parentPort!.postMessage({ status: "exit", currentIndex: data.currentIndex });
        return;
    }
    while (data.currentIndex < data.batch.length) {  
        if (Atomics.load(data.batch, data.currentIndex) === 0) {
            data.currentIndex++;
            continue;
        };
        break;
    }

    if (data.currentIndex >= data.batch.length) {
        parentPort!.postMessage({currentIndex: data.currentIndex, status: "exit"});
        return;
    }
    Atomics.exchange(data.batch, data.currentIndex, 0);
    let result = await sendTransactionAsync(data.workerbatches[data.currentIndex].txInputs, data.workerbatches[data.currentIndex].txOutputs, data.worker, data.currentIndex);
    parentPort!.postMessage(result);
});