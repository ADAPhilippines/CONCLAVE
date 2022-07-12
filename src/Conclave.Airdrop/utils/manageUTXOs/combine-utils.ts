// import { TxBodyInput } from "../../types/response-types";
// import { coinSelectionAsync } from "../coin-utils";
// import { blockfrostAPI, createAndSignRewardTxAsync, shelleyChangeAddress } from "../transaction-utils";
// import { awaitChangeInUTXOAsync, getSmallUTXOs, queryAllUTXOsAsync } from "../utxo-utils";

// export const combineUTXOsAsync = async () => {
//     console.log('Combining UTXOs');
//     let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
//     let txInputsSent: Array<TxBodyInput> = [];

//     let rewards = getSmallUTXOs(utxos);
//     if (rewards?.txInputs === null || rewards?.txOutputs === null || rewards === null) return;

//     let txinputoutputs = await coinSelectionAsync(rewards.txInputs, rewards.txOutputs);
//     if (txinputoutputs == null || txinputoutputs === undefined) return;

//     if (rewards === null) return;

//     for (let txItem of txinputoutputs) {
//         let transaction = await createAndSignRewardTxAsync(txItem);
//         if (transaction == null) return;

//         console.log('Combining Small UTXOs');
//         console.log(
//             'Transaction ' + transaction.txHash.to_bech32('tx_test').toString() + ' fee ' + transaction.transaction.body().fee().to_str()
//         );

//         //Submit Transaction
//         // let txResult = await submitTransactionAsync(transaction.transaction, transaction.txHash, txItem);
//         // if (txResult !== null) {
//         //     txInputsSent = txInputsSent.concat(txInputsSent, txResult.txInputs);
//         //     txOutputSent = txOutputSent.concat(txOutputSent, txResult.txOutputs);
//         // }

//         console.log(' ');
//     }
//     await awaitChangeInUTXOAsync(txInputsSent);
// };