import { Reward } from "../types/database-types";
import { PendingReward } from "../types/helper-types";
import { RewardTxBodyDetails, TxBodyInput } from "../types/response-types";

export const initRewardTxBodyDetails = (
    inputs: Array<TxBodyInput>,
    outputSum: number,
    fee: string = "0",
    outputs: Array<PendingReward> = []): RewardTxBodyDetails => {
    const newTxBodyDetails: RewardTxBodyDetails = {
        txInputs: inputs,
        txOutputs: outputs,
        fee: fee,
        txOutputSum: outputSum,
    };

    return newTxBodyDetails;
}

export const initReward = (
    id: string, 
    rewardAmount: number, 
    rewardType: number, 
    walletAddress: string,
    stakeAddress: string) => {
    let _reward: Reward = {
        id: id,
        rewardType: rewardType,
        walletAddress: walletAddress,
        rewardAmount: rewardAmount,
        stakeAddress: stakeAddress,
    }
    return _reward;
}