import { blockfrostAPI } from "./config/network.config";
import { shelleyChangeAddress } from "./config/walletKeys.config";
import { WorkerBatch } from "./types/response-types";
import { sendTransactionAsync } from "./utils/airdrop-utils";
import { getWorkerBatches } from "./utils/txBody/txInput-utils";
import { queryAllUTXOsAsync } from "./utils/utxo-utils";

const airdropTransaction = async () => {
    await displayUTXOs();
    //1 divide large utxos
    //2 get Output Batches
    //3 get Input Batches
    //4 combine input output batch
    //4 create reward transaction
    //5 submit
    // await divideUTXOsAsync();
    let InputOutputBatches: Array<WorkerBatch> = await getWorkerBatches();

    for (let batches : Array<WorkerBatch> = InputOutputBatches.splice(0,10); batches.length > 0; batches = InputOutputBatches.splice(0,10)) {
        if (batches.length > 0) {
            await batchesToProcess(batches);
        }
    }
}

const displayUTXOs = async () => {
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

airdropTransaction()
async function batchesToProcess(batches: WorkerBatch[]) {
    batches.forEach(async (batch, index) => {
        sendTransactionAsync(batch.txInputs, batch.txOutputs, index);
    });
}

