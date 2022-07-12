import { Reward } from "../types/database-types";
import { RewardTxBodyDetails } from "../types/response-types";
import { isNull } from "./boolean-utils";
import { createRewardTxBodyAsync } from "./txBody/txBody-utils";
import { initReward, initRewardTxBodyDetails } from "./type-utils";

export const calculateRewardFeesAsync = async (newTxBodyDetails: RewardTxBodyDetails): Promise<string | null> => {
    let _txOutputs: Array<Reward> = [];

    const _newTxBodyDetails: RewardTxBodyDetails = initRewardTxBodyDetails(newTxBodyDetails.txInputs, newTxBodyDetails.txOutputSum);

    newTxBodyDetails.txOutputs.forEach((e) => {
        let _reward: Reward = initReward(e.id, 2000000, e.rewardType, e.walletAddress, e.conclaveAmount)
        _txOutputs.push(_reward);
    });
    _newTxBodyDetails.txOutputs = _txOutputs;

    let _result = await createRewardTxBodyAsync(_newTxBodyDetails);
    if (isNull(_result)) return null;

    return _result!.txBody.fee().to_str();
}

export const deductRewardFees = (txBodyDetails: RewardTxBodyDetails) => {
    let newFee = parseInt(txBodyDetails.fee) + 200;
    txBodyDetails.txOutputs.forEach((e) => {
        e.lovelaceAmount = parseInt((e.lovelaceAmount - (newFee / txBodyDetails.txOutputSum) * e.lovelaceAmount).toFixed());
    });
}