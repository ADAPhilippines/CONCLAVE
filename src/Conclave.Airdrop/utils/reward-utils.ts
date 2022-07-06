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

// Helpers

const getUnpaidRewardAsync = async (table: string) => {
    // convert to api
    const params = {
        query: `SELECT d."Id", d."DelegatorSnapshotId", d."RewardAmount", s."WalletAddress", s."StakeAddress"
        FROM ${
            table === 'DelegatorRewards'
                ? `"${table}"`
                : `(SELECT x."${
                      table === 'NFTRewards'
                          ? 'NFTSnapshotId'
                          : table === 'OperatorRewards'
                          ? 'OperatorSnapshotId'
                          : 'ConclaveOwnerSnapshotId'
                  }", y."DelegatorSnapshotId", x."Id", x."RewardAmount", x."AirdropStatus"
                  FROM "${table}" as x 
                  INNER JOIN "${
                      table === 'NFTRewards' ? 'NFTSnapshots' : table === 'OperatorRewards' ? 'OperatorSnapshots' : 'ConclaveOwnerSnapshots'
                  }" as y ON (x."${
                      table === 'NFTRewards'
                          ? 'NFTSnapshotId'
                          : table === 'OperatorRewards'
                          ? 'OperatorSnapshotId'
                          : 'ConclaveOwnerSnapshotId'
                  }" = y."Id"))`
        } as d
        INNER JOIN ${
            table === 'DelegatorRewards'
                ? `"${'DelegatorSnapshots'}"`
                : `(SELECT x."DelegatorSnapshotId", xd."Id", xd."WalletAddress", xd."StakeAddress" FROM ${
                      table === 'NFTRewards'
                          ? `"${'NFTSnapshots'}"`
                          : table === 'OperatorRewards'
                          ? `"${'OperatorSnapshots'}"`
                          : `"${'ConclaveOwnerSnapshots'}"`
                  } as x INNER JOIN "DelegatorSnapshots" as xd ON (x."DelegatorSnapshotId" = xd."Id"))`
        } as s 
        ON (d."DelegatorSnapshotId" = s."Id") 
        WHERE d."AirdropStatus"=$1 OR d."AirdropStatus"=$2`,
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
            walletAddress: reward.WalletAddress,
            stakeAddress: reward.StakeAddress
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
