import { ConclaveAmount, Reward } from "../types/database-types";
import { ConclaveTxBodyDetails, RewardTxBodyDetails, TxBodyInput } from "../types/response-types";
import { isEmpty, isInputSumLarger, isNull, isOutputSumLarger, isUndefined, isWithinTxLimit, isZero } from "./boolean-utils";
import { deductConclaveFees, deductRewardFees } from "./fees-utils";
import { addFirstItemFromReserveBatch, getArrayBatch, removeLastItemFromCurrentBatch, sortConclaveAmountAscending, sortInputAscending, sortInputDescending, sortRewardAscending } from "./list-utils";
import { conclaveInputSum, conclaveOutputSum, lovelaceCollateralOutputSum, lovelaceInputSum, lovelaceRewardOutputSum, reserveLovelaceSum } from "./sum-utils";
import { policyStr } from "./transaction-utils";
import { createConclaveTxBodyWithFee, createRewardTxBodywithFee } from "./txBody/txBody-utils";

export const rewardCoinSelection = async (
    txBodyInputs: Array<TxBodyInput>,
    txBodyOutputs: Array<Reward>
): Promise<Array<RewardTxBodyDetails> | null> => {
    let reservedBodyInputs = sortInputDescending(txBodyInputs);
    let reservedBodyOutputs = sortRewardAscending(txBodyOutputs);
    let maxtxItems = 249;
    let txBodyDetailsArray: Array<RewardTxBodyDetails> = [];

    let currentUTXOsBatch: Array<TxBodyInput> = getArrayBatch(maxtxItems, reservedBodyInputs);
    let currentOutputsBatch: Array<Reward> = getArrayBatch(maxtxItems, reservedBodyOutputs);

    while (!isEmpty(currentOutputsBatch) && !isEmpty(currentUTXOsBatch)) {
        while (!isWithinTxLimit(currentUTXOsBatch, currentOutputsBatch, maxtxItems)) {
            if (isInputSumLarger(lovelaceInputSum(currentUTXOsBatch), lovelaceRewardOutputSum(currentOutputsBatch))) {
                removeLastItemFromCurrentBatch(currentUTXOsBatch, reservedBodyInputs);
                continue;
            }
            removeLastItemFromCurrentBatch(currentOutputsBatch, reservedBodyOutputs);
        }
        while (isOutputSumLarger(lovelaceRewardOutputSum(currentOutputsBatch), lovelaceInputSum(currentUTXOsBatch))) {
            removeLastItemFromCurrentBatch(currentOutputsBatch, reservedBodyOutputs);
        }
        if (isZero(lovelaceRewardOutputSum(currentOutputsBatch))) break;

        while (isInputSumLarger(lovelaceInputSum(currentUTXOsBatch), lovelaceRewardOutputSum(currentOutputsBatch))) {
            removeLastItemFromCurrentBatch(currentUTXOsBatch, reservedBodyInputs);
        }
        addFirstItemFromReserveBatch(currentUTXOsBatch, reservedBodyInputs);

        if (
            isZero(lovelaceRewardOutputSum(currentOutputsBatch)) ||
            !isInputSumLarger(lovelaceInputSum(currentUTXOsBatch), lovelaceRewardOutputSum(currentOutputsBatch)))
            break;

        let newTxBodyDetails = await createRewardTxBodywithFee(currentUTXOsBatch, currentOutputsBatch, lovelaceRewardOutputSum(currentOutputsBatch));
        if (!isNull(newTxBodyDetails) && !isUndefined(newTxBodyDetails)) txBodyDetailsArray.push(newTxBodyDetails!);

        currentUTXOsBatch = getArrayBatch(maxtxItems, reservedBodyInputs);
        currentOutputsBatch = getArrayBatch(maxtxItems, reservedBodyOutputs);
    }

    deductRewardFees(txBodyDetailsArray);
    return txBodyDetailsArray;
};

const maxCollateralPossible = (maxUTXO: number, inputBatch: Array<any>, outputBatch: Array<any>): number => {
    return maxUTXO - (inputBatch.length + outputBatch.length);
}

export const conclaveCoinSelection = async (
    conclaveUTXOInputs: Array<TxBodyInput>,
    conclaveBodyOutputs: Array<ConclaveAmount>,
    rawAdaUTXOBodyInputs: Array<TxBodyInput>
) => {
    let _pureAdaTxBodyInputs = sortInputAscending(rawAdaUTXOBodyInputs);
    let _conclaveTxBodyOutputs = sortConclaveAmountAscending(conclaveBodyOutputs);
    let _conclaveTxBodyInputs = sortInputDescending(conclaveUTXOInputs, policyStr);
    let maxUTXO = 141;
    let conclaveTxBodyDetailsArray: Array<ConclaveTxBodyDetails> = [];

    let currentConclaveInputsBatch: Array<TxBodyInput> = getArrayBatch(maxUTXO, _conclaveTxBodyInputs)
    let currentConclaveOutputsBatch: Array<ConclaveAmount> = getArrayBatch(maxUTXO, _conclaveTxBodyOutputs)

    //change name
    while (!isEmpty(currentConclaveInputsBatch) && !isEmpty(currentConclaveOutputsBatch)) {
        while (!isWithinTxLimit(currentConclaveInputsBatch, currentConclaveOutputsBatch, maxUTXO)) {

            if (isInputSumLarger(conclaveInputSum(currentConclaveInputsBatch), conclaveOutputSum(currentConclaveOutputsBatch))) {
                removeLastItemFromCurrentBatch(currentConclaveInputsBatch, _conclaveTxBodyInputs);
                continue;
            }
            removeLastItemFromCurrentBatch(currentConclaveOutputsBatch, _conclaveTxBodyOutputs);
        }
        if (isZero(conclaveOutputSum(currentConclaveOutputsBatch))) break;

        let maxCollateral = maxCollateralPossible(maxUTXO, currentConclaveInputsBatch, currentConclaveOutputsBatch);
        let collateralReserveBatch: Array<TxBodyInput> = getArrayBatch(maxCollateral, _pureAdaTxBodyInputs);

        while (
            isOutputSumLarger(conclaveOutputSum(currentConclaveOutputsBatch), conclaveInputSum(currentConclaveInputsBatch)) ||
            isOutputSumLarger(lovelaceCollateralOutputSum(currentConclaveOutputsBatch), reserveLovelaceSum(collateralReserveBatch) + lovelaceInputSum(currentConclaveInputsBatch))) {

            if (isEmpty(currentConclaveOutputsBatch)) break;
            removeLastItemFromCurrentBatch(currentConclaveOutputsBatch, _conclaveTxBodyOutputs);
            addFirstItemFromReserveBatch(collateralReserveBatch, _pureAdaTxBodyInputs);
        }
        if (isZero(conclaveOutputSum(currentConclaveOutputsBatch))) break;

        while (
            isInputSumLarger(conclaveInputSum(currentConclaveInputsBatch), conclaveOutputSum(currentConclaveOutputsBatch)) &&
            isInputSumLarger(reserveLovelaceSum(collateralReserveBatch) + lovelaceInputSum(currentConclaveInputsBatch), conclaveOutputSum(currentConclaveOutputsBatch))) {

            if (isEmpty(currentConclaveInputsBatch)) break;
            removeLastItemFromCurrentBatch(currentConclaveInputsBatch, _conclaveTxBodyInputs);
            addFirstItemFromReserveBatch(collateralReserveBatch, _pureAdaTxBodyInputs);
        }
        addFirstItemFromReserveBatch(currentConclaveInputsBatch, _conclaveTxBodyInputs);
        removeLastItemFromCurrentBatch(collateralReserveBatch, _pureAdaTxBodyInputs);

        while (isOutputSumLarger(lovelaceCollateralOutputSum(currentConclaveOutputsBatch), lovelaceInputSum(currentConclaveInputsBatch))) {
            if (isEmpty(collateralReserveBatch)) break;
            addFirstItemFromReserveBatch(currentConclaveInputsBatch, collateralReserveBatch);
        }

        if (
            isZero(conclaveOutputSum(currentConclaveOutputsBatch)) ||
            !isInputSumLarger(conclaveInputSum(currentConclaveInputsBatch), conclaveOutputSum(currentConclaveOutputsBatch)) ||
            !isInputSumLarger(lovelaceInputSum(currentConclaveInputsBatch), lovelaceCollateralOutputSum(currentConclaveOutputsBatch)))
            break;

        let newTxBodyDetails: ConclaveTxBodyDetails | null = await createConclaveTxBodyWithFee(
            currentConclaveInputsBatch,
            currentConclaveOutputsBatch,
            conclaveOutputSum(currentConclaveOutputsBatch),
            lovelaceCollateralOutputSum(currentConclaveOutputsBatch));

        if (
            newTxBodyDetails != null &&
            newTxBodyDetails !== undefined) {
            conclaveTxBodyDetailsArray.push(newTxBodyDetails);
        }

        currentConclaveInputsBatch = getArrayBatch(maxUTXO, _conclaveTxBodyInputs);
        currentConclaveOutputsBatch = getArrayBatch(maxUTXO, _conclaveTxBodyOutputs);
        collateralReserveBatch = [];
    }
    conclaveTxBodyDetailsArray = deductConclaveFees(conclaveTxBodyDetailsArray);
    return conclaveTxBodyDetailsArray;
};