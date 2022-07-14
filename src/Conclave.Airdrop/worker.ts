import { sendTransactionAsync } from "./utils/airdrop-utils";
import { parentPort } from "worker_threads";
import { WorkerBatch } from "./types/response-types";

// parentPort!.on("message", async (data) => {
//     await sendTransactionAsync(data.batch.txInputs, data.batch.txOutputs, data.index);
// });

parentPort!.on("message", async (data : { batch: Int32Array, currentIndex: number, worker: number, workerbatches: Array<WorkerBatch> }) => { 
    while (data.currentIndex < data.batch.length) {  
        if (Atomics.load(data.batch, data.currentIndex) === 0) {
            data.currentIndex++;
            continue;
        };
        break;
    }

    if (data.currentIndex >= data.batch.length) {
        parentPort!.postMessage({batch: data.batch, currentIndex: data.currentIndex, status: "exit"});
        return;
    }

    Atomics.exchange(data.batch, data.currentIndex, 0);
    await sendTransactionAsync(data.workerbatches[data.currentIndex].txInputs,data.workerbatches[data.currentIndex].txOutputs, data.worker);
    console.log("done worker " + data.worker + " for index#" + data.currentIndex);
    parentPort?.postMessage({batch: data.batch, currentIndex: data.currentIndex, status: "confirmed"});
});