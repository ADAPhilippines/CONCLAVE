import { Reward } from './database-types';

export type PendingReward = {
    stakeAddress: string;
    rewards: Reward[];
};

export type displayUTXO = {
    txHash: string;
    outputIndex: string;
    assets: string;
};
