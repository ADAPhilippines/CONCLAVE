import { ConclaveAmount, Reward } from "../types/database-types";
import { TxBodyInput } from "../types/response-types";

export const removeLastItemFromCurrentBatch = (batchArray: Array<any>, reserveArray: Array<any>) => {
    if (batchArray.length > 0) reserveArray.unshift(batchArray.pop()!);
};

export const addFirstItemFromReserveBatch = (batchArray: Array<any>, reserveArray: Array<any>) => {
    if (reserveArray.length > 0) batchArray.push(reserveArray.shift()!);
}
export const sortRewardAscending = (array: Array<Reward>): Array<Reward> => {
    return array.sort((a, b) => {
        return a.rewardAmount - b.rewardAmount;
    });
}

export const sortInputDescending = (array: Array<TxBodyInput>, unit: string = "lovelace"): Array<TxBodyInput> => {
    let _array = array.filter(f => (unit == "lovelace" ? f.asset.length == 1 : f.asset.length != 1) && (f.asset.find(f => f.unit == unit)!.unit == unit))!;
    return _array.sort((a, b) => {
        return parseInt(b.asset.find(f => f.unit == unit)!.quantity) - parseInt(a.asset.find(f => f.unit == unit)!.quantity);
    });
}

export const sortInputAscending = (array: Array<TxBodyInput>, unit: string = "lovelace"): Array<TxBodyInput> => {
    let _array = array.filter(f => (unit == "lovelace" ? f.asset.length == 1 : f.asset.length != 1) && (f.asset.find(f => f.unit == unit)!.unit == unit))!;
    return _array.sort((a, b) => {
        return parseInt(a.asset.find(f => f.unit == unit)!.quantity) - parseInt(b.asset.find(f => f.unit == unit)!.quantity);
    });
}

export const sortConclaveAmountAscending = (array: Array<ConclaveAmount>): Array<ConclaveAmount> => {
    return array.sort((a, b) => {
        return a.conclaveAmount - b.conclaveAmount;
    });
}

export const getArrayBatch = (batchSize: number, array: Array<any>): Array<any> => array.splice(0, batchSize - 1);