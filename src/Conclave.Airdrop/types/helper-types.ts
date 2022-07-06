import { Reward } from "./database-types";

export type PendingReward = {
    stakeAddress: string;
    rewards: Reward[]
}