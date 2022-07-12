import { policyStr } from "../config/walletKeys.config";
import { Reward } from "../types/database-types";
import { PendingReward } from "../types/helper-types";
import { TxBodyInput } from "../types/response-types";

export const getOutputLovelaceSum = (currentOutputBatch: Array<PendingReward>): number => {
    if (currentOutputBatch === null || currentOutputBatch === undefined) return 0;

    let _partialSum = 0;
    currentOutputBatch.forEach((reward) => {
        _partialSum += reward.rewards.find(e => e.rewardType === 3)?.rewardAmount ?? 0;
    });

    return _partialSum;
};

export const getOutputConclaveSum = (currentConclaveOutputBatch: Array<PendingReward>): number => {
    if (currentConclaveOutputBatch === null || currentConclaveOutputBatch === undefined) return 0;

    let _partialSum = 0;
    currentConclaveOutputBatch.forEach((reward) => {
        reward.rewards.filter(e => e.rewardType !== 3).forEach((conclaveAmount) => {
            _partialSum += conclaveAmount.rewardAmount;
        });
    });

    return _partialSum;
};

export const getInputAssetUTXOSum = (currentUTXOs: Array<TxBodyInput> | null | undefined, unit: string = "lovelace"): number => {
    if (currentUTXOs === null || currentUTXOs === undefined || currentUTXOs.length === 0) return 0;

    let _partialSum = 0;
    currentUTXOs.forEach((utxo) => {
        if (
            utxo.asset.find(f => f.unit == unit) !== undefined &&
            utxo.asset.find(f => f.unit == unit) !== null &&
            utxo.asset.find(f => f.unit == unit)?.quantity !== undefined &&
            utxo.asset.find(f => f.unit == unit)?.quantity !== null) {
            _partialSum += parseInt(utxo.asset.find(f => f.unit == unit)!.quantity);
        }
    });

    return _partialSum;
};

export const conclaveInputSum = (inputs: Array<TxBodyInput> | null | undefined): number => {
    return getInputAssetUTXOSum(inputs, policyStr);
};

export const conclaveOutputSum = (outputs: Array<PendingReward>): number => {
    return getOutputConclaveSum(outputs);
};

export const lovelaceInputSum = (inputs: Array<TxBodyInput>): number => {
    return getInputAssetUTXOSum(inputs);
};

export const lovelaceRewardOutputSum = (inputs: Array<PendingReward>): number => {
    return getOutputLovelaceSum(inputs);
};

export const lovelaceOutputSum = (outputs: Array<PendingReward>): number => {
    return getOutputLovelaceSum(outputs);
}

export const reserveLovelaceSum = (reservedInputs: Array<TxBodyInput>): number => {
    return getInputAssetUTXOSum(reservedInputs);
}