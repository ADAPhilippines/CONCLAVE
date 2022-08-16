import RewardType from '../enums/reward-type';
import { Reward, RawReward } from '../types/database-types';
import { PendingReward } from '../types/helper-types';
import { AirdropBatch } from '../types/response-types';
import { consoleWithWorkerId } from '../worker';
import { getTotalQuantity, getTotalRewardQuantity } from './sum-utils';

export const updateRewardListStatusAsync = async (
    rewards: Reward[],
    airdropStatus: number,
    transactionHash: string
): Promise<void> => {
    consoleWithWorkerId.log('Updating database...');
    // console.log(`${process.env.CONCLAVE_API_BASE_URL}/reward/update/${transactionHash ?? ''}/${airdropStatus}`);
    const res = await fetch(`${process.env.CONCLAVE_API_BASE_URL}/reward/update/${transactionHash}/${airdropStatus}`, {
        method: 'PUT',
        body: JSON.stringify(rewards),
        headers: { 'Content-Type': 'application/json' },
    });
    consoleWithWorkerId.log(`Done updating airdrop status for tx hash: ${transactionHash}`);
};

export const getUnpaidRewardAsync = async (): Promise<Reward[]> => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    var res = await fetch(process.env.CONCLAVE_API_BASE_URL + '/reward/unpaid', {});
    var rewards: Reward[] = [];

    if (res.ok) {
        var data: RawReward[] = await res.json();
        rewards = data.map((d) => ({
            Id: d.id,
            RewardType: d.rewardType,
            RewardAmount: d.rewardAmount,
            WalletAddress: d.walletAddress,
            StakeAddress: d.stakeAddress,
            TransactionHash: d.transactionHash,
        }));
    }

    return rewards;
};

export const getAllPendingRewardsAsync = async (): Promise<{
    newPendingRewards: PendingReward[];
    inProgressPendingRewards: PendingReward[];
}> => {
    const unpaidRewards = await getUnpaidRewardAsync();
    return groupRewards(unpaidRewards);
};

export const getAllPendingTransactionsAsync = async (): Promise<string[]> => {
    const res = await fetch(process.env.CONCLAVE_API_BASE_URL + '/reward/inprogress');
    const pendingTransactions = await res.json();
    return pendingTransactions;
};

export const getAllPendingEligibleRewardsAsync = async (): Promise<{
    newPendingRewards: PendingReward[];
    inProgressPendingRewards: PendingReward[];
}> => {
    let { newPendingRewards, inProgressPendingRewards } = await getAllPendingRewardsAsync();
    newPendingRewards = filterRewards(newPendingRewards);
    return { newPendingRewards, inProgressPendingRewards };
};

export const getAllRewards = (pendingRewards: PendingReward[]): Reward[] => {
    const rewardList = [];

    for (var pendingReward of pendingRewards) {
        for (var reward of pendingReward.rewards) {
            rewardList.push(reward);
        }
    }

    return rewardList;
};

// Helpers

const getUpdatedRewardStatus = async (reward: Reward, airdropStatus: number, transactionHash: string) => {
    let res;
    switch (reward.RewardType) {
        case RewardType.DelegatorReward:
            res = await fetch(process.env.CONCLAVE_API_BASE_URL + '/DelegatorReward/' + reward.Id);
            break;
        case RewardType.OperatorReward:
            res = await fetch(process.env.CONCLAVE_API_BASE_URL + '/OperatorReward/' + reward.Id, {});
            break;
        case RewardType.NFTReward:
            res = await fetch(process.env.CONCLAVE_API_BASE_URL + '/NFTReward/' + reward.Id, {});
            break;
        case RewardType.ConclaveOwnerReward:
            res = await fetch(process.env.CONCLAVE_API_BASE_URL + '/ConclaveOwnerReward/' + reward.Id, {});
            break;
        default:
            throw new Error('Invalid Reward Type!');
    }
    const updatedRewardData = await res.json();
    updatedRewardData.airdropStatus = airdropStatus;
    updatedRewardData.transactionHash = transactionHash;

    return updatedRewardData;
};

const groupRewards = (
    rewards: Reward[]
): { newPendingRewards: PendingReward[]; inProgressPendingRewards: PendingReward[] } => {
    let newRewardsGroupedByStakeAddress: PendingReward[] = [
        /*{stakeAddress: Reward[]}*/
    ];

    let inProgressRewardsGroupedByStakeAddress: PendingReward[] = [];

    for (let reward of rewards) {
        let pendingReward: PendingReward | undefined;
        const isNew = reward.TransactionHash === null || reward.TransactionHash === '';

        // let pendingReward = newRewardsGroupedByStakeAddress.find(r => r.stakeAddress === reward.StakeAddress);

        if (isNew) {
            pendingReward = newRewardsGroupedByStakeAddress.find((r) => r.stakeAddress === reward.StakeAddress);
        } else {
            pendingReward = inProgressRewardsGroupedByStakeAddress.find((r) => r.stakeAddress === reward.StakeAddress);
        }

        if (pendingReward) {
            pendingReward.rewards.push(reward);
        } else {
            if (isNew) {
                newRewardsGroupedByStakeAddress.push({
                    stakeAddress: reward.StakeAddress,
                    rewards: [reward],
                });
            } else {
                inProgressRewardsGroupedByStakeAddress.push({
                    stakeAddress: reward.StakeAddress,
                    rewards: [reward],
                });
            }
        }
    }

    return {
        newPendingRewards: newRewardsGroupedByStakeAddress,
        inProgressPendingRewards: inProgressRewardsGroupedByStakeAddress,
    };
};

const filterRewards = (
    pendingRewards: PendingReward[],
    adaFee: number = 0.4 * 1_000_000,
    minimumCollateral: number = 1.4 * 1_000_000
) => {
    let filteredRewards: PendingReward[] = [];

    for (var pendingReward of pendingRewards) {
        let totalAdaRewards = 0.0;
        for (let reward of pendingReward.rewards) {
            if (reward.RewardType === RewardType.ConclaveOwnerReward) {
                totalAdaRewards += reward.RewardAmount as number;
            } else {
                reward.RewardAmount = Math.trunc(reward.RewardAmount);
            }
        }

        if (totalAdaRewards < adaFee + minimumCollateral) continue;

        filteredRewards.push(pendingReward);
    }

    return filteredRewards;
};

const displayPendingRewards = (pendingRewards: PendingReward[]) => {
    pendingRewards.forEach((pendingReward) => {
        console.table(
            pendingReward.rewards.forEach((reward) => {
                console.table(reward);
            })
        );
    });
};

const displayInputOutputTotals = (inputOutputBatches: Array<AirdropBatch>, policyId: string) => {
    inputOutputBatches.forEach((e, index) => {
        console.log('BATCH #' + index);
        console.log('INPUT LOVELACE SUM: ' + getTotalQuantity('lovelace', e.txInputs));
        console.log('INPUT CONCLAVE SUM: ' + getTotalQuantity(policyId, e.txInputs));
        console.log('OUTPUT LOVELACE SUM: ' + getTotalRewardQuantity(true, e.txOutputs));

        console.log('OUTPUT CONCLAVE SUM: ' + getTotalRewardQuantity(false, e.txOutputs));
        console.log('INPUT UTXO COUNT: ' + e.txInputs.length);
        console.log('OUTPUT ACCOUNT COUNT: ' + e.txOutputs.length);
    });
};
