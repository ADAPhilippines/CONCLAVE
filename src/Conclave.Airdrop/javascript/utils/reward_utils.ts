import { QueryResult } from 'pg';
import { queryAsync } from '../db';
import AirdropStatus from '../enums/airdrop-status';
import RewardType from '../enums/reward-type';
import { Reward } from '../types/database-types';

// TODO: check if total reward can cover the fees

export const getAllUnpaidConclaveTokenRewardsAsync = async (): Promise<Reward[]> => {
    const unpaidList: Reward[] = [];
    const delegatorRewards = await getUnpaidRewardAsync('DelegatorRewards');
    const nftRewards = await getUnpaidRewardAsync('NFTRewards');
    const operatorReward = await getUnpaidRewardAsync('OperatorRewards');

    unpaidList.push(
        ...mapToReward(delegatorRewards, RewardType.DelegatorReward),
        ...mapToReward(nftRewards, RewardType.NFTReward),
        ...mapToReward(operatorReward, RewardType.OperatorReward)
    );

    return unpaidList;
};

export const getAllUnpaidAdaRewardsAsync = async (): Promise<Reward[]> => {
    const adaRewards = await getUnpaidRewardAsync('ConclaveOwnerRewards');

    return mapToReward(adaRewards, RewardType.ConclaveOwnerReward);
};

export const updateRewardListStatusAsync = async (rewards: Reward[], airdropStatus: number, transactionHash: string): Promise<void> => {
    for (const reward of rewards) {
        await updateRewardStatusAsync(reward, airdropStatus, transactionHash);
    }
};

//

const getUnpaidRewardAsync = async (table: string) => {
    const params = {
        query: `SELECT * FROM "${table}" WHERE "AirdropStatus" = $1 OR "AirdropStatus" = $2`,
        values: [AirdropStatus.Failed, AirdropStatus.New],
    };

    return await queryAsync(params.query, params.values);
};

const mapToReward = (rewards: QueryResult<any>, rewardType: number): Reward[] => {
    const rewardList: Reward[] = [];
    rewards.rows.forEach((reward) => {
        rewardList.push({
            id: reward.Id,
            rewardType: rewardType,
            rewardAmount: reward.RewardAmount,
        });
    });

    return rewardList;
};

const updateRewardStatusAsync = async (reward: Reward, airdropStatus: number, transactionHash: string): Promise<QueryResult<any>> => {
    let table = '';

    const params = {
        query: '',
        values: [airdropStatus, transactionHash],
    };

    switch (reward.rewardType) {
        case RewardType.DelegatorReward:
            table = 'DelegatorRewards';
            break;
        case RewardType.OperatorReward:
            table = 'OperatorRewards';
            break;
        case RewardType.NFTReward:
            table = 'NFTRewards';
            break;
        case RewardType.ConclaveOwnerReward:
            table = 'ConclaveOwnerRewards';
            break;
        default:
            throw new Error('Invalid Reward Type!');
    }

    params.query = `UPDATE "${table}" SET AirdropStatus=$1, TransactionHash=$1 WHERE Id = ${reward.id}`;

    return await queryAsync(params.query, params.values);
};
