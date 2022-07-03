import { ConclaveAmount, Reward } from "../types/database-types";
import { ConclaveTxBodyDetails, RewardTxBodyDetails } from "../types/response-types";
import { isNull } from "./boolean-utils";
import { createConclaveTxBodyAsync, createRewardTxBodyAsync } from "./txBody/txBody-utils";
import { initConclaveAmount, initConclaveTxBodyDetails, initReward, initRewardTxBodyDetails } from "./type-utils";

export const calculateRewardFeesAsync = async (newTxBodyDetails: RewardTxBodyDetails): Promise<string | null> => {
    let _txOutputs: Array<Reward> = [];

    const _newTxBodyDetails: RewardTxBodyDetails = initRewardTxBodyDetails(newTxBodyDetails.txInputs, newTxBodyDetails.txOutputSum);

    newTxBodyDetails.txOutputs.forEach((e) => {
        let _reward: Reward = initReward(e.id, 1000000, e.rewardType, e.walletAddress)
        _txOutputs.push(_reward);
    });
    _newTxBodyDetails.txOutputs = _txOutputs;

    let _result = await createRewardTxBodyAsync(_newTxBodyDetails);
    if (isNull(_result)) return null;

    return _result!.txBody.fee().to_str();
};

export const calculateConclaveFeesAsync = async (newTxBodyDetails: ConclaveTxBodyDetails): Promise<string | null> => {
    let _txOutputs: Array<ConclaveAmount> = [];

    const _newTxBodyDetails: ConclaveTxBodyDetails = initConclaveTxBodyDetails(
        newTxBodyDetails.txInputs,
        newTxBodyDetails.collateralOutputSum,
        newTxBodyDetails.conclaveOutputSum,
        "0",
        []);

    newTxBodyDetails.txOutputs.forEach((e) => {
        let _conclaveAmount: ConclaveAmount = initConclaveAmount(
            e.id,
            e.conclaveAmount,
            2000000,
            e.walletAddress)

        _txOutputs.push(_conclaveAmount);
    });
    _newTxBodyDetails.txOutputs = _txOutputs;

    let _result = await createConclaveTxBodyAsync(_newTxBodyDetails);
    if (_result == null) return null;

    return _result.txBody.fee().to_str();
};

export const deductRewardFees = (txBodyDetailsArray: Array<RewardTxBodyDetails>) => {
    txBodyDetailsArray.forEach((element) => {
        let newFee = parseInt(element.fee) + 200;
        element.txOutputs.forEach((e) => {
            e.rewardAmount = parseInt((e.rewardAmount - (newFee / element.txOutputSum) * e.rewardAmount).toFixed());
        });
    });
};

export const deductConclaveFees = (txBodyDetailsArray: Array<ConclaveTxBodyDetails>): Array<ConclaveTxBodyDetails> => {
    txBodyDetailsArray.forEach((element) => {
        let newFee = parseInt(element.fee) + 200;
        element.txOutputs.forEach((e) => {
            e.collateralAmount = parseInt((e.collateralAmount - (newFee / element.collateralOutputSum) * e.collateralAmount).toFixed());
        });
    });

    return txBodyDetailsArray;
};