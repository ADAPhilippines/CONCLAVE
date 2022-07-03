import { ConclaveAmount, Reward } from "../types/database-types";
import { ConclaveTxBodyDetails, RewardTxBodyDetails, TxBodyInput } from "../types/response-types";

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

export const initReward = (id: string, rewardAmount: number, rewardType: number, walletAddress: string) => {
    let _reward: Reward = {
        id: id,
        rewardAmount: rewardAmount,
        rewardType: rewardType,
        walletAddress: walletAddress
    }
    return _reward;
}

export const initConclaveAmount = (
    id: string,
    conclaveAmount: number,
    collateralAmount: number,
    walletAddress: string) => {
    let _conclaveAmount: ConclaveAmount = {
        id: id,
        collateralAmount: collateralAmount,
        conclaveAmount: conclaveAmount,
        walletAddress: walletAddress
    }
    return _conclaveAmount;
}
export const initConclaveTxBodyDetails = (
    inputs: Array<TxBodyInput>,
    collateraSum: number,
    conclaveSum: number,
    fee: string = "0",
    outputs: Array<ConclaveAmount> = []): ConclaveTxBodyDetails => {
    const newTxBodyDetails: ConclaveTxBodyDetails = {
        txInputs: inputs,
        txOutputs: outputs,
        fee: fee,
        collateralOutputSum: collateraSum,
        conclaveOutputSum: conclaveSum
    }
    return newTxBodyDetails;
}