import { WorkerBatch } from "../types/response-types";
import { Worker } from "worker_threads";

export const executeWorkers = async (inputOutputBatches: Array<WorkerBatch>) => {
    const sharedArray = createSharedArray(inputOutputBatches);

    for (let i = 0; i < inputOutputBatches.length; i++) {
        Atomics.store(sharedArray, i, i + 1);
    }

    //initialize only 10 workers
    for (let i = 0; i < 10; i++) {
        if (i >= inputOutputBatches.length) break;

        const worker = new Worker("./worker.js");

        worker.on("message", (result: { status: String, currentIndex: number}) => {
            let index = result.currentIndex;
            if (result.status == "exit") {
                worker.terminate();
                return;
            }

            worker.postMessage({ batch: sharedArray, currentIndex: index + 1, worker: i, workerbatches: inputOutputBatches });
        });
        worker.postMessage({ batch: sharedArray, currentIndex: i, worker: i, workerbatches: inputOutputBatches });
    }
}

const createSharedArray = (inputOutputBatches: Array<WorkerBatch>) : Int32Array => {
    let length: number = inputOutputBatches.length;
    let size: number;

    while (true) {
        try {
            size = Int32Array.BYTES_PER_ELEMENT * length;
            break;
        } catch (e) {
            console.log(e);
        }
        length++;
    }

    const sharedBuffer = new SharedArrayBuffer(size);
    return new Int32Array(sharedBuffer);
}