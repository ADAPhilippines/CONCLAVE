import { Reward } from "../types/database-types";
import { RewardTxBodyDetails, TxBodyInput } from "../types/response-types";
import { lovelaceOutputSum } from "./sum-utils";
import { setTTLAsync } from "./transaction-utils";
import { createRewardTxBodyAsync, createRewardTxBodywithFee, setRewardTxBodyDetailsAsync } from "./txBody/txBody-utils";
import { initReward, initRewardTxBodyDetails } from "./type-utils";
import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';
import { shelleyChangeAddress } from "../config/walletKeys.config";

export const isNull = (item: any | null): boolean => {
    if (item === null) return true;
    else return false;
}

export const isUndefined = (item: any | undefined): boolean => {
    if (item === undefined) return true;
    else return false;
}

export const isEmpty = (batch: Array<any>): boolean => {
    if (batch.length <= 0) return true;
    else return false;
}

export const isWithinTxSizeLimit = async (
    txInputs: Array<TxBodyInput>,
    txOutputs: Array<Reward>,
    index: number): Promise<boolean> => {
    let outputSum = lovelaceOutputSum(txOutputs);
    try {
        let _txOutputs: Array<Reward> = [];

        const _newTxBodyDetails: RewardTxBodyDetails = initRewardTxBodyDetails(txInputs, outputSum);

        txOutputs.forEach((e) => {
            let _reward: Reward = initReward(e.id, 2000000, e.rewardType, e.walletAddress, 1)
            _txOutputs.push(_reward);
        });
        _newTxBodyDetails.txOutputs = _txOutputs;

        let txBuilder = await setRewardTxBodyDetailsAsync(_newTxBodyDetails);
        txBuilder.add_change_if_needed(shelleyChangeAddress);
        console.log("CurrentTxSize for worker #" + index + ": " + txBuilder.full_size().toString());
        if (txBuilder.full_size() > 16384) {
            return false;
        }
        return true;
    } catch (error) {
        console.log("Rebuilding TxBody for index#" + index + ": " + error);
        return false;
    }
}

export const isOutputSumLarger = (outputSum: number, inputSum: number): boolean => inputSum < (outputSum + 1000000);

export const isZero = (number: number): boolean => {
    if (number <= 0) return true;
    else return false;
}

export const isInputSumLarger = (inputSum: number, outputSum: number): boolean => (outputSum + 1000000) <= inputSum;