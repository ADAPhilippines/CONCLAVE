import { policyStr } from "../config/walletKeys.config";
import { Reward } from "../types/database-types";
import { TxBodyInput } from "../types/response-types";

export const getOutputLovelaceSum = (currentOutputBatch: Array<Reward>): number => {
    if (currentOutputBatch === null || currentOutputBatch === undefined) return 0;

    let _partialSum = 0;
    currentOutputBatch.forEach((reward) => {
        _partialSum += reward.lovelaceAmount;
    });

    return _partialSum;
};

export const getOutputConclaveSum = (currentConclaveOutputBatch: Array<Reward>): number => {
    if (currentConclaveOutputBatch === null || currentConclaveOutputBatch === undefined) return 0;

    let _partialSum = 0;
    currentConclaveOutputBatch.forEach((conclaveAmount) => {
        _partialSum += conclaveAmount.conclaveAmount;
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

export const conclaveOutputSum = (outputs: Array<Reward>): number => {
    return getOutputConclaveSum(outputs);
};

export const lovelaceInputSum = (inputs: Array<TxBodyInput>): number => {
    return getInputAssetUTXOSum(inputs);
};

export const lovelaceRewardOutputSum = (inputs: Array<Reward>): number => {
    return getOutputLovelaceSum(inputs);
};

export const lovelaceOutputSum = (outputs: Array<Reward>): number => {
    return getOutputLovelaceSum(outputs);
}

export const reserveLovelaceSum = (reservedInputs: Array<TxBodyInput>): number => {
    return getInputAssetUTXOSum(reservedInputs);
}