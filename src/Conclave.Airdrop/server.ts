// import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
// import CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
// import axios from 'axios';
// import { mnemonicToEntropy } from 'bip39';
// import fetch from 'node-fetch';
// import { getLatestProtocolParametersAsync } from './config/network.config';
// import { getTransactionBuilder } from './config/transaction.config';
// import RewardType from './enums/reward-type';
// import { Reward } from './types/database-types';
// import { PendingReward } from './types/helper-types';
// import { UTXO } from './types/response-types';
// import { getCurrentEpochsAsync, getProtocolParametersAsync } from './utils/epoch-utils';
// import { getUnpaidRewardAsync } from './utils/reward-utils';
// import { getPureAdaUtxos, getUtxosWithAsset } from './utils/utxo-utils';

import { accountKey, addressBech32, privKey, rootKey, shelleyChangeAddress, utxoPrvKey, utxoPubKey } from "./config/walletKeys.config";
import { divideUTXOsAsync } from "./utils/manageUTXOs/divideUTXO-utils";

// const blockfrostAPI = new BlockFrostAPI({
//     projectId: process.env.PROJECT_ID as string,
//     isTestnet: true,
// });

// const main = async () => {
//     var pendingRewards: Reward[] = await getUnpaidRewardAsync();
//     var rewardsGroupedByStakeAddress: PendingReward[] = groupRewards(pendingRewards);
//     var eligibleRewards: PendingReward[] = filterRewards(rewardsGroupedByStakeAddress);

//     console.log(eligibleRewards);

//     while (true) {
//         // get all utxos
//         var utxosWithAsset: UTXO = await getUtxosWithAsset(
//             blockfrostAPI,
//             process.env.BASE_ADDRESS as string,
//             process.env.CONCLAVE_UNIT_ID as string
//         );
//         var pureAdaUtxos: UTXO = await getPureAdaUtxos(blockfrostAPI, process.env.BASE_ADDRESS as string);

//         console.log({ utxosWithAsset, pureAdaUtxos });

//         // total amount of assets
//         var totalAda: number =
//             utxosWithAsset
//                 .map((x) => Number(x.amount.find((u) => u.unit === 'lovelace')?.quantity))
//                 .reduce((acc, val) => acc + val) +
//             pureAdaUtxos
//                 .map((u) => Number(u.amount.find((x) => x.unit === 'lovelace')?.quantity))
//                 .reduce((acc, val) => acc + val);

//         var totalConclaveTokens: number = utxosWithAsset
//             .map((x) => Number(x.amount.find((u) => u.unit === (process.env.CONCLAVE_UNIT_ID as string))?.quantity))
//             .reduce((acc, val) => acc + val);

//         console.log({ totalAda, totalConclaveTokens });
//         // build transaction
//         var currentEpoch = await getCurrentEpochsAsync(blockfrostAPI);
//         var transactionParams = await getLatestProtocolParametersAsync(blockfrostAPI);
//         var transacionBuilder = getTransactionBuilder(transactionParams);

//         // holds rewards included in the transaction
//         var includedEligibleRewards: PendingReward[] = [];

//         // TODO: tx outputs
//         for (var eligibleReward of eligibleRewards) {
//             // add in the transaction builder until max output is reached
//         }

//         // TODO: tx inputs to cover rewards set

//         // TODO: send transaction

//         // TODO: update reward status of rewards included in the transaction
//     }
// };

// const groupRewards = (pendingRewards: Reward[]): PendingReward[] => {
//     var rewardsGroupedByStakeAddress: PendingReward[] = [
//         /*{stakeAddress: Reward[]}*/
//     ];

//     for (var pendingReward of pendingRewards) {
//         var rewards = rewardsGroupedByStakeAddress.find((r) => r.stakeAddress === pendingReward.stakeAddress);
//         if (rewards) {
//             rewards.rewards.push(pendingReward);
//         } else {
//             rewardsGroupedByStakeAddress.push({
//                 stakeAddress: pendingReward.stakeAddress,
//                 rewards: [pendingReward],
//             });
//         }
//     }
//     return rewardsGroupedByStakeAddress;
// };

// const filterRewards = (pendingRewards: PendingReward[], adaFee: number = 0.4, minimumCollateral: number = 1.4) => {
//     let filteredRewards: PendingReward[] = [];

//     for (var pendingReward of pendingRewards) {
//         let totalConclaveTokenRewards = 0.0;
//         let totalAdaRewards = 0.0;
//         for (const reward of pendingReward.rewards) {
//             if (reward.rewardType === RewardType.ConclaveOwnerReward) {
//                 totalAdaRewards += reward.rewardAmount as number;
//             } else {
//                 totalConclaveTokenRewards += reward.rewardAmount as number;
//             }
//         }

//         if (totalAdaRewards < adaFee + minimumCollateral) continue;

//         filteredRewards.push(pendingReward);
//     }

//     return filteredRewards;
// };

// main();
// divideUTXOsAsync();

import { TxBodyInput, WorkerBatch } from "./types/response-types";
import { getBatchesPerWorker } from "./utils/txBody/txInput-utils";
import { executeWorkers } from "./utils/worker-utils";
import { queryAllUTXOsAsync } from "./utils/utxo-utils";
import { blockfrostAPI } from "./config/network.config";
import { getAllUTXOsAsync } from "./utils/airdrop-utils";
import { dummyDataOutput } from "./utils/txBody/txOutput-utils";
import { PendingReward } from "./types/helper-types";
import { isEmpty, isNull } from "./utils/boolean-utils";


const airdropFunction = async () => {
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
    // await divideUTXOsAsync(utxos);

    let utxosInWallet : Array<TxBodyInput> = await getAllUTXOsAsync();
    let pendingRewards : Array<PendingReward> = dummyDataOutput(); //replace with RJ's function
    if (isEmpty(pendingRewards) || isNull(pendingRewards)) return;
    
    let InputOutputBatches: Array<WorkerBatch> = await getBatchesPerWorker(utxosInWallet, pendingRewards);

    await executeWorkers(InputOutputBatches); //execute code to send transaction for each worker
}

airdropFunction();
