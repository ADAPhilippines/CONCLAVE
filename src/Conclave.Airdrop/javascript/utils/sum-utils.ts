import { ConclaveAmount, Reward } from "../types/database-types";
import { TxBodyInput } from "../types/response-types";
import { policyStr } from "./transaction-utils";

export const getOutputAmountSum = (currentOutputBatch: Array<Reward>): number => {
    if (currentOutputBatch === null || currentOutputBatch === undefined) return 0;

    let _partialSum = 0;
    currentOutputBatch.forEach((reward) => {
        _partialSum += reward.rewardAmount;
    });

    return _partialSum;
};

export const conclaveOutputSum = (currentConclaveOutputBatch: Array<ConclaveAmount>): number => {
    if (currentConclaveOutputBatch === null || currentConclaveOutputBatch === undefined) return 0;

    let _partialSum = 0;
    currentConclaveOutputBatch.forEach((conclaveAmount) => {
        _partialSum += conclaveAmount.conclaveAmount;
    });

    return _partialSum;
};

export const getCollateralOutputAmountSum = (currentConclaveOutputBatch: Array<ConclaveAmount>): number => {
    if (currentConclaveOutputBatch === null || currentConclaveOutputBatch === undefined || currentConclaveOutputBatch.length === 0) return 0;

    let _partialSum = 0;
    currentConclaveOutputBatch.forEach((collateral) => {
        _partialSum += collateral.collateralAmount;
    });

    return _partialSum;
};

export const getInputAssetUTXOSum = (currentUTXOs: Array<TxBodyInput>, unit: string = "lovelace"): number => {
    if (currentUTXOs === null || currentUTXOs === undefined || currentUTXOs.length === 0) return 0;

    let _partialSum = 0;
    currentUTXOs.forEach((utxo) => {
        if (
            utxo.asset.find(f => f.unit == unit) !== undefined &&
            utxo.asset.find(f => f.unit == unit)?.quantity !== undefined &&
            utxo.asset.find(f => f.unit == unit)?.quantity !== null) {
            _partialSum += parseInt(utxo.asset.find(f => f.unit == unit)!.quantity);
        }
    });

    return _partialSum;
};

export const conclaveInputSum = (inputs: Array<TxBodyInput>): number => {
    return getInputAssetUTXOSum(inputs, policyStr);
};

export const lovelaceInputSum = (inputs: Array<TxBodyInput>): number => {
    return getInputAssetUTXOSum(inputs);
};

export const lovelaceRewardOutputSum = (inputs: Array<Reward>): number => {
    return getOutputAmountSum(inputs);
};

export const lovelaceCollateralOutputSum = (outputs: Array<ConclaveAmount>): number => {
    return getCollateralOutputAmountSum(outputs);
}

export const reserveLovelaceSum = (reservedInputs: Array<TxBodyInput>): number => {
    return getInputAssetUTXOSum(reservedInputs);
}