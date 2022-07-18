import { QueryResult } from 'pg';
import { queryAsync } from '../db';
import AirdropStatus from '../enums/airdrop-status';
import RewardType from '../enums/reward-type';
import { Reward } from '../types/database-types';
import { PendingReward } from '../types/helper-types';
// import fetch from 'node-fetch';

// TODO: check if total reward can cover the fees

// export const getAllUnpaidConclaveTokenRewardsAsync = async (): Promise<Reward[]> => {
//     const unpaidList: Reward[] = [];
//     const delegatorRewards = await getUnpaidRewardAsync('DelegatorRewards');
//     const nftRewards = await getUnpaidRewardAsync('NFTRewards');
//     const operatorReward = await getUnpaidRewardAsync('OperatorRewards');

//     unpaidList.push(
//         ...mapToReward(delegatorRewards, RewardType.DelegatorReward),
//         ...mapToReward(nftRewards, RewardType.NFTReward),
//         ...mapToReward(operatorReward, RewardType.OperatorReward)
//     );

//     return unpaidList;
// };

// export const getAllUnpaidAdaRewardsAsync = async (): Promise<Reward[]> => {
//     const adaRewards = await getUnpaidRewardAsync('ConclaveOwnerRewards');

//     return mapToReward(adaRewards, RewardType.ConclaveOwnerReward);
// };

export const updateRewardListStatusAsync = async (
    rewards: Reward[],
    airdropStatus: number,
    transactionHash: string
): Promise<void> => {
    for (const reward of rewards) {
        await updateRewardStatusAsync(reward, airdropStatus, transactionHash);
    }
};

export const getUnpaidRewardAsync = async (): Promise<Reward[]> => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    var res = await fetch(process.env.CONCLAVE_API_BASE_URL + '/reward/unpaid', {});
    var data = await res.json();
    return res.ok ? data : [];
};

export const getAllPendingRewardsAsync = async (): Promise<PendingReward[]> => {
    const unpaidRewards = await getUnpaidRewardAsync();
    return groupRewards(unpaidRewards);
};

export const getAllPendingEligibleRewardsAsync = async (): Promise<PendingReward[]> => {
    const pendingRewards = await getAllPendingRewardsAsync();
    return filterRewards(pendingRewards);
};

export const updateRewardStatusAsync = async (reward: Reward, airdropStatus: number, transactionHash: string) => {
    let updatedRewardData = await getUpdatedRewardStatus(reward, airdropStatus, transactionHash);
    await updateRewardAsync(reward, updatedRewardData);
};

// Helpers

const getUpdatedRewardStatus = async (reward: Reward, airdropStatus: number, transactionHash: string) => {
    let res;
    switch (reward.rewardType) {
        case RewardType.DelegatorReward:
            res = await fetch(process.env.CONCLAVE_API_BASE_URL + '/DelegatorReward/' + reward.id);
            break;
        case RewardType.OperatorReward:
            res = await fetch(process.env.CONCLAVE_API_BASE_URL + '/OperatorReward/' + reward.id, {});
            break;
        case RewardType.NFTReward:
            res = await fetch(process.env.CONCLAVE_API_BASE_URL + '/NFTReward/' + reward.id, {});
            break;
        case RewardType.ConclaveOwnerReward:
            res = await fetch(process.env.CONCLAVE_API_BASE_URL + '/ConclaveOwnerReward/' + reward.id, {});
            break;
        default:
            throw new Error('Invalid Reward Type!');
    }
    const updatedRewardData = await res.json();
    updatedRewardData.airdropStatus = airdropStatus;
    updatedRewardData.transactionHash = transactionHash;

    return updatedRewardData;
};

const updateRewardAsync = async (reward: Reward, updatedRewardData: any): Promise<JSON> => {
    let res;
    switch (reward.rewardType) {
        case RewardType.DelegatorReward:
            res = await fetch(process.env.CONCLAVE_API_BASE_URL + '/DelegatorReward/' + reward.id, {
                method: 'PUT',
                body: JSON.stringify(updatedRewardData),
                headers: { 'Content-Type': 'application/json' },
            });
            break;
        case RewardType.OperatorReward:
            res = await fetch(process.env.CONCLAVE_API_BASE_URL + '/OperatorReward/' + reward.id, {
                method: 'PUT',
                body: JSON.stringify(updatedRewardData),
                headers: { 'Content-Type': 'application/json' },
            });
            break;
        case RewardType.NFTReward:
            res = await fetch(process.env.CONCLAVE_API_BASE_URL + '/NFTReward/' + reward.id, {
                method: 'PUT',
                body: JSON.stringify(updatedRewardData),
                headers: { 'Content-Type': 'application/json' },
            });
            break;
        case RewardType.ConclaveOwnerReward:
            res = await fetch(process.env.CONCLAVE_API_BASE_URL + '/ConclaveOwnerReward/' + reward.id, {
                method: 'PUT',
                body: JSON.stringify(updatedRewardData),
                headers: { 'Content-Type': 'application/json' },
            });
            break;
        default:
            throw new Error('Invalid Reward Type!');
    }
    return await res.json();
};

const groupRewards = (pendingRewards: Reward[]): PendingReward[] => {
    var rewardsGroupedByStakeAddress: PendingReward[] = [
        /*{stakeAddress: Reward[]}*/
    ];

    for (var pendingReward of pendingRewards) {
        var rewards = rewardsGroupedByStakeAddress.find((r) => r.stakeAddress === pendingReward.stakeAddress);
        if (rewards) {
            rewards.rewards.push(pendingReward);
        } else {
            rewardsGroupedByStakeAddress.push({
                stakeAddress: pendingReward.stakeAddress,
                rewards: [pendingReward],
            });
        }
    }
    return rewardsGroupedByStakeAddress;
};

const filterRewards = (pendingRewards: PendingReward[], adaFee: number = 0.4 * 1_000_000, minimumCollateral: number = 1.4 * 1_000_000) => {
    let filteredRewards: PendingReward[] = [];

    for (var pendingReward of pendingRewards) {
        let totalAdaRewards = 0.0;
        for (let reward of pendingReward.rewards) {
           
            if (reward.rewardType === RewardType.ConclaveOwnerReward) {
                totalAdaRewards += reward.rewardAmount as number;
            } else {
                reward.rewardAmount = Math.trunc(reward.rewardAmount);
            }
        }

        if (totalAdaRewards < adaFee + minimumCollateral) continue;

        filteredRewards.push(pendingReward);
    }

    return filteredRewards;
};
