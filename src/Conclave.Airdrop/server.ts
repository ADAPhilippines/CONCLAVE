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

import {
  accountKey,
  addressBech32,
  privKey,
  rootKey,
  shelleyChangeAddress,
  utxoPrvKey,
  utxoPubKey,
} from "./config/walletKeys.config";
import { divideUTXOsAsync } from "./utils/manageUTXOs/divideUTXO-utils";
import { TxBodyInput, WorkerBatch } from "./types/response-types";
import { getBatchesPerWorker } from "./utils/txBody/txInput-utils";
import { executeWorkers } from "./utils/worker-utils";
import { queryAllUTXOsAsync } from "./utils/utxo-utils";
import { blockfrostAPI } from "./config/network.config";
import { getAllUTXOsAsync } from "./utils/airdrop-utils";
import { dummyDataOutput } from "./utils/txBody/txOutput-utils";
import { PendingReward } from "./types/helper-types";
import { isEmpty, isNull } from "./utils/boolean-utils";
import {
  getAllPendingEligibleRewardsAsync,
  getAllPendingRewardsAsync,
} from "./utils/reward-utils";
import {
  conclaveInputSum,
  conclaveOutputSum,
  lovelaceInputSum,
  lovelaceOutputSum,
} from "./utils/sum-utils";

const airdropFunction = async () => {
  let utxos = await queryAllUTXOsAsync(
    blockfrostAPI,
    shelleyChangeAddress.to_bech32()
  );
  // await divideUTXOsAsync(utxos);

  let utxosInWallet: Array<TxBodyInput> = await getAllUTXOsAsync();
  let pendingRewards: Array<PendingReward> =
    await getAllPendingEligibleRewardsAsync();
  // let pendingRewards2 : Array<PendingReward> = await getAllPendingRewardsAsync();

  pendingRewards.forEach((pendingReward) => {
    console.table(
      pendingReward.rewards.forEach((reward) => {
        console.table(reward);
      })
    );
  });

  // pendingRewards2.forEach(pendingReward => {
  //     console.table(pendingReward.rewards.forEach(reward => {
  //         console.table(reward);
  //     }));
  // });

  if (isEmpty(pendingRewards) || isNull(pendingRewards)) return;
  let InputOutputBatches: Array<WorkerBatch> = await getBatchesPerWorker(
    utxosInWallet,
    pendingRewards
  );

  //   export type PendingReward = {
  //     stakeAddress: string;
  //     rewards: Reward[]
  // }

  InputOutputBatches.forEach((e, index) => {
    console.log("BATCH #" + index);
    console.log(
      "INPUT LOVELACE SUM: " + getTotalQuantity("lovelace", e.txInputs)
    );
    console.log(
      "INPUT CONCLAVE SUM: " +
        getTotalQuantity(
          "b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca1853616d706c65546f6b656e4a0a",
          e.txInputs
        )
    );
    console.log(
      "OUTPUT LOVELACE SUM: " + getTotalRewardQuanity(true, e.txOutputs)
    );

    console.log(
      "OUTPUT CONCLAVE SUM: " + getTotalRewardQuanity(false, e.txOutputs)
    );
    console.log("INPUT UTXO COUNT: " + e.txInputs.length);
    console.log("OUTPUT ACCOUNT COUNT: " + e.txOutputs.length);
  });
  await executeWorkers(InputOutputBatches); //execute code to send transaction for each worker
};

// Helper

const getTotalQuantity = (unit: string, data: TxBodyInput[]) => {
  return data
    .map((input) =>
      Number(
        input.asset
          .filter((asset) => asset.unit === unit)
          .map((asset) => Number(asset.quantity))
          .reduce((acc, next) => acc + next)
      )
    )
    .reduce((acc, next) => acc + next);
};

const getTotalRewardQuanity = (isAda: boolean, data: PendingReward[]) => {
  return data
    .map((out) =>
      out.rewards
        .filter((reward) =>
          isAda ? reward.rewardType === 3 : reward.rewardType !== 3
        )
        .map((reward) => Number(reward.rewardAmount))
        .reduce((acc, next) => acc + next)
    )
    .reduce((acc, next) => acc + next);
};

// BATCH #0
// INPUT LOVELACE SUM: 279493194
// INPUT CONCLAVE SUM: 689413782
// OUTPUT LOVELACE SUM: 600000000
// OUTPUT CONCLAVE SUM: 1099
// BATCH #1
// INPUT LOVELACE SUM: 249992996
// INPUT CONCLAVE SUM: 10000000
// OUTPUT LOVELACE SUM: 600000000
// OUTPUT CONCLAVE SUM: 1001

airdropFunction();
