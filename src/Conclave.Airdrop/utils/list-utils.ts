import { Reward } from "../types/database-types";
import { PendingReward } from "../types/helper-types";
import { TxBodyInput } from "../types/response-types";
import { isNull, isUndefined } from "./boolean-utils";

export const removeLastItemFromCurrentBatch = (batchArray: Array<any>, reserveArray: Array<any>) => {
    if (batchArray.length > 0) reserveArray.unshift(batchArray.pop()!);
}

export const addFirstItemFromReserveBatch = (batchArray: Array<any>, reserveArray: Array<any>) => {
    if (reserveArray.length > 0) batchArray.push(reserveArray.shift()!);
}

// export const sortRewardAscending = (array: Array<Reward>): Array<Reward> => {
//     return array.sort((a, b) => {
//         return a.lovelaceAmount - b.lovelaceAmount;
//     });
// }

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

// export const sortConclaveAmountAscending = (array: Array<Reward>): Array<Reward> => {
//     return array.sort((a, b) => {
//         return a.conclaveAmount - b.conclaveAmount;
//     });
// }

export const getArrayBatch = (batchSize: number, array: Array<any>): Array<any> => array.splice(0, batchSize - 1);

export const getIdxLargestLovelaceReward = (rewards: Array<PendingReward>): number => {
    var i;
    var max = rewards[0];

    for (i = 1; i < rewards.length; i++) {
        if (rewards[i].rewards.find(e => e.rewardType == 3)!.rewardAmount > max.rewards.find(e => e.rewardType == 3)!.rewardAmount)
            max = rewards[i];
    }

    return rewards.indexOf(max);
}

export const getIdxSmallestLovelaceReward = (rewards: Array<PendingReward>): number => {
    var i;
    var min = rewards.find(reward => reward.rewards.find(e => e.rewardType === 3)!.rewardAmount > 0);

    for (i = 0; i < rewards.length; i++) {
        if (
            (rewards[i].rewards.find(e => e.rewardType == 3)!.rewardAmount < min!.rewards.find(e => e.rewardType == 3)!.rewardAmount) && 
            (rewards[i].rewards.find(e => e.rewardType == 3)!.rewardAmount > 0) && 
            (rewards[i].rewards.find(e => e.rewardType == 3)!.rewardAmount == 0))
            min = rewards[i];
    }

    return rewards.indexOf(min!);
}

export const getIdxLargestConclaveReward = (rewards: Array<PendingReward>): number | null => {
    var i;
    var max = rewards.find(reward => reward.rewards.find(e => e.rewardType !== 3) !== undefined);
    var conclaveSum = 0;

    if (isUndefined(max)) return null;
    max!.rewards.filter(e => e.rewardType !== 3).forEach(reward => {
        conclaveSum += reward.rewardAmount ?? 0;
    });

    for (i = 0; i < rewards.length; i++) {
        let newSum = 0;
        var newMax = rewards[i].rewards.find(e => e.rewardType !== 3);
        if (isUndefined(newMax)) continue;

        rewards[i]!.rewards.filter(e => e.rewardType !== 3).forEach(reward => {
            newSum += reward.rewardAmount ?? 0;
        });

        if (newSum > conclaveSum) {
            conclaveSum = newSum;
            max = rewards[i];
        }
    }

    return conclaveSum == 0 ? null : rewards.indexOf(max!);
}

export const getIdxSmallestConclaveReward = (rewards: Array<PendingReward>): number | null => {
    var i;
    var max = rewards.find(reward => reward.rewards.find(e => e.rewardType !== 3) !== undefined);
    var conclaveSum = 0;

    if (isUndefined(max)) return null;
    max!.rewards.filter(e => e.rewardType !== 3).forEach(reward => {
        conclaveSum += reward.rewardAmount ?? 0;
    });

    for (i = 0; i < rewards.length; i++) {
        let newSum = 0;
        var newMax = rewards[i].rewards.find(e => e.rewardType !== 3);
        if (isUndefined(newMax)) continue;

        rewards[i]!.rewards.filter(e => e.rewardType !== 3).forEach(reward => {
            newSum += reward.rewardAmount ?? 0;
        });

        if (newSum < conclaveSum) {
            conclaveSum = newSum;
            max = rewards[i];
        }
    }

    return conclaveSum == 0 ? null : rewards.indexOf(max!);
}

export const removeLargestConclaveReward = (rewards: Array<PendingReward>): Array<PendingReward> => {
    var idxMax = getIdxLargestConclaveReward(rewards);
    if (idxMax == null) return rewards;

    rewards.splice(idxMax, 1);
    return rewards;
}

export const removeLargestLovelaceReward = (rewards: Array<PendingReward>): Array<PendingReward> => {
    var idxMax = getIdxLargestLovelaceReward(rewards);

    rewards.splice(idxMax, 1);
    return rewards;
}

export const addSmallestConclaveReward = (currentBatch: Array<PendingReward>, reserveBatch: Array<PendingReward>) => {
    var idxMin = getIdxSmallestConclaveReward(reserveBatch);
    if (isNull(idxMin)) return { currentBatch, reserveBatch };

    currentBatch.push(reserveBatch[idxMin!]);
    reserveBatch.splice(idxMin!, 1);

    return { currentBatch, reserveBatch };
}

export const addSmallestLovelaceReward = (currentBatch: Array<PendingReward>, reserveBatch: Array<PendingReward>) => {
    var idxMin = getIdxSmallestLovelaceReward(reserveBatch);
    if (isNull(idxMin)) return { currentBatch, reserveBatch };

    currentBatch.push(reserveBatch[idxMin!]);
    reserveBatch.splice(idxMin!, 1);

    return { currentBatch, reserveBatch };
}

export const removeLastItem = (array: Array<any>): Array<any> => {
    array.splice(-1);
    return array;
}

export const shuffleArray = (array: Array<any>): Array<any> => {
    let currentIndex = array.length,  randomIndex;
    
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
    
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    
    return array;
}