import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import axios from 'axios';
import { mnemonicToEntropy } from 'bip39';
import fetch from 'node-fetch';
import RewardType from './enums/reward-type';
import { Reward } from './types/database-types';
import { PendingReward } from './types/helper-types';
import { UTXO } from './types/response-types';
import { getCurrentEpochsAsync, getProtocolParametersAsync } from './utils/epoch-utils';
import { getAllUnpaidAdaRewardsAsync, getAllUnpaidConclaveTokenRewardsAsync } from './utils/reward-utils';
import { getLatestProtocolParametersAsync, getTransactionBuilder, sendRewardTransactionAsync, sendTokenTransactionAsync } from './utils/transaction-utils';
import { getPureAdaUtxos, getUtxosWithAsset } from './utils/utxo-utils';

const blockfrostAPI = new BlockFrostAPI({
    projectId: process.env.PROJECT_ID as string,
    isTestnet: true,
});

const main = async () => {
    var pendingConclaveTokenRewards: Reward[] = await getAllUnpaidConclaveTokenRewardsAsync();
    var pendingAdaRewards: Reward[] = await getAllUnpaidAdaRewardsAsync();
    var rewardsGroupedByStakeAddress: PendingReward[] = groupRewards(pendingConclaveTokenRewards, pendingAdaRewards);
    var eligibleRewards: PendingReward[] = filterRewards(rewardsGroupedByStakeAddress);


    
    while (true) {
        // get all utxos
        var utxosWithAsset: UTXO = await getUtxosWithAsset(blockfrostAPI, process.env.BASE_ADDRESS as string, process.env.CONCLAVE_UNIT_ID as string);
        var pureAdaUtxos: UTXO = await getPureAdaUtxos(blockfrostAPI, process.env.BASE_ADDRESS as string);

        // total amount of assets
        var totalAda: number = utxosWithAsset.map(x => Number(x.amount.find(u => u.unit === "lovelace")?.quantity)).reduce((acc, val) => acc + val) + pureAdaUtxos.map(u => Number(u.amount.find(x => x.unit === "lovelace")?.quantity)).reduce((acc, val) => acc + val);
        var totalConclaveTokenRewards: number = utxosWithAsset.map(x => Number(x.amount.find(u => u.unit === process.env.CONCLAVE_UNIT_ID as string)?.quantity)).reduce((acc, val) => acc + val);

        // build transaction
        var currentEpoch = await getCurrentEpochsAsync(blockfrostAPI);
        var transactionParams = await getLatestProtocolParametersAsync(blockfrostAPI);
        var transacionBuilder = getTransactionBuilder(transactionParams);
        var includedEligibleRewards: PendingReward[] = [];

        for (var eligibleReward of eligibleRewards) {
            // put transaction in the transaction builder
        }
    }
};


const groupRewards = (pendingConclaveTokenRewards: Reward[], pendingAdaRewards: Reward[]): PendingReward[] => {
    var rewardsGroupedByStakeAddress: PendingReward[] = [/*{stakeAddress: Reward[]}*/];

    for (var pendingConclaveTokenReward of pendingConclaveTokenRewards) {
        var pendingReward = rewardsGroupedByStakeAddress.find(r => r.stakeAddress);
        if (pendingReward) {
            pendingReward.rewards.push(pendingConclaveTokenReward);
        } else {
            rewardsGroupedByStakeAddress.push({stakeAddress: pendingConclaveTokenReward.stakeAddress, rewards: [pendingConclaveTokenReward]});
        }
    }

    for (var pendingAdaReward of pendingAdaRewards) {
        var pendingReward = rewardsGroupedByStakeAddress.find(r => r.stakeAddress);
        if (pendingReward) {
            pendingReward.rewards.push(pendingAdaReward);
        } else {
            rewardsGroupedByStakeAddress.push({stakeAddress: pendingAdaReward.stakeAddress, rewards: [pendingAdaReward]});
        }
    }

    return rewardsGroupedByStakeAddress;
}

const filterRewards = (pendingRewards: PendingReward[], adaFee: number =  0.4, minimumCollateral: number =  1.4) => {

    var filteredRewards: PendingReward[] = [];

    for (var pendingReward of pendingRewards) {
        var totalConclaveTokenRewards = 0.0;
        var totalAdaRewards = 0.0;
        for (var reward of pendingReward.rewards) {
            if (reward.rewardType === RewardType.ConclaveOwnerReward) {
                totalAdaRewards += reward.rewardAmount;
            } else {
                totalConclaveTokenRewards += reward.rewardAmount;
            }
        }

        if (totalAdaRewards < (adaFee + minimumCollateral)) continue;

        filteredRewards.push(pendingReward);
    }

    return filteredRewards;
}

main();