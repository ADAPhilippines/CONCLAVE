import { Reward } from "../types/database-types";
import { RewardTxBodyDetails, TxBodyInput } from "../types/response-types";

export const initRewardTxBodyDetails = (
    inputs: Array<TxBodyInput>,
    outputSum: number,
    fee: string = "0",
    outputs: Array<Reward> = []): RewardTxBodyDetails => {
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
    conclaveAmount: number) => {
    let _reward: Reward = {
        id: id,
        lovelaceAmount: rewardAmount,
        rewardType: rewardType,
        conclaveAmount: conclaveAmount,
        walletAddress: walletAddress
    }
    return _reward;
}