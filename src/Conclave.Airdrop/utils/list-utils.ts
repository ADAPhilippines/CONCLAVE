import { PendingReward } from '../types/helper-types';
import { TxBodyInput } from '../types/response-types';
import { isNull, isOutputSumLarger, isUndefined, isZero } from './boolean-utils';
import { conclaveInputSum, conclaveOutputSum, purelovelaceOutputSum } from './sum-utils';

export const removeLastItemFromCurrentBatch = (batchArray: Array<any>, reserveArray: Array<any>) => {
    if (batchArray.length > 0) reserveArray.unshift(batchArray.pop()!);
};

export const addFirstItemFromReserveBatch = (batchArray: Array<any>, reserveArray: Array<any>) => {
    if (reserveArray.length > 0) batchArray.push(reserveArray.shift()!);
};

export const sortInputDescending = (array: Array<TxBodyInput>, unit: string = 'lovelace'): Array<TxBodyInput> => {
    let _array = array.filter(
        (f) =>
            (unit == 'lovelace' ? f.asset.length == 1 : f.asset.length != 1) &&
            f.asset.find((f) => f.unit == unit)!.unit == unit
    )!;
    return _array.sort((a, b) => {
        return (
            parseInt(b.asset.find((f) => f.unit == unit)!.quantity) -
            parseInt(a.asset.find((f) => f.unit == unit)!.quantity)
        );
    });
};

export const sortInputAscending = (array: Array<TxBodyInput>, unit: string = 'lovelace'): Array<TxBodyInput> => {
    let _array = array.filter(
        (f) =>
            (unit == 'lovelace' ? f.asset.length == 1 : f.asset.length != 1) &&
            f.asset.find((f) => f.unit == unit)!.unit == unit
    )!;
    return _array.sort((a, b) => {
        return (
            parseInt(a.asset.find((f) => f.unit == unit)!.quantity) -
            parseInt(b.asset.find((f) => f.unit == unit)!.quantity)
        );
    });
};

export const getArrayBatch = (batchSize: number, array: Array<any>): Array<any> => array.splice(0, batchSize - 1);

export const getIdxLargestLovelaceRewardWithConclave = (pendingRewards: Array<PendingReward>): number => {
    let max = 0;
    let idx = 0;

    pendingRewards[0].rewards.forEach((reward) => {
        if (reward.RewardType === 3) max += reward.RewardAmount;
    });

    for (let i = 0; i < pendingRewards.length; i++) {
        let _max = 0;
        pendingRewards[i].rewards.forEach((reward) => {
            if (reward.RewardType === 3) _max += reward.RewardAmount;
        });

        if (_max >= max) {
            max = _max;
            idx = i;
        }
    }

    return idx;
};

export const getIdxLargestLovelaceReward = (pendingRewards: Array<PendingReward>): number => {
    var i;
    var pendingReward = pendingRewards.find(
        (pendingReward) => pendingReward.rewards.find((e) => e.RewardType !== 3) === undefined
    );

    if (pendingReward === undefined) return getIdxLargestLovelaceRewardWithConclave(pendingRewards);
    let max = 0;
    let idx = pendingRewards.indexOf(pendingReward);

    pendingReward.rewards.forEach((reward) => {
        max += reward.RewardAmount;
    });

    for (i = 0; i < pendingRewards.length; i++) {
        if (pendingRewards[i].rewards.find((e) => e.RewardType !== 3)) {
            continue;
        }

        let _max = 0;
        pendingRewards[i].rewards.forEach((reward) => {
            _max += reward.RewardAmount;
        });

        if (_max >= max) {
            max = _max;
            idx = i;
        }
    }

    return idx;
};

export const getIdxSmallestLovelaceReward = (pendingRewards: Array<PendingReward>): number => {
    var i;
    var pendingReward = pendingRewards.find(
        (pendingReward) => pendingReward.rewards.find((e) => e.RewardType !== 3) === undefined
    );

    if (pendingReward === undefined) return getIdxSmallestLovelaceRewardWithConclave(pendingRewards);
    let min = 0;
    let idx = pendingRewards.indexOf(pendingReward);

    pendingReward.rewards.forEach((reward) => {
        min += reward.RewardAmount;
    });

    for (i = 0; i < pendingRewards.length; i++) {
        if (pendingRewards[i].rewards.find((e) => e.RewardType !== 3)) {
            continue;
        }

        let _min = 0;
        pendingRewards[i].rewards.forEach((reward) => {
            _min += reward.RewardAmount;
        });

        if (_min < min) {
            min = _min;
            idx = i;
        }
    }

    return idx;
};

export const getIdxSmallestLovelaceRewardWithConclave = (pendingRewards: Array<PendingReward>): number => {
    let min = 0;
    let idx = 0;

    pendingRewards[0].rewards.forEach((reward) => {
        if (reward.RewardType === 3) min += reward.RewardAmount;
    });

    for (let i = 0; i < pendingRewards.length; i++) {
        let _min = 0;
        pendingRewards[i].rewards.forEach((reward) => {
            if (reward.RewardType === 3) _min += reward.RewardAmount;
        });

        if (_min <= min) {
            min = _min;
            idx = i;
        }
    }

    return idx;
};

export const getIdxLargestConclaveReward = (rewards: Array<PendingReward>): number | null => {
    var i;
    var max = rewards.find((reward) => reward.rewards.find((e) => e.RewardType !== 3) !== undefined);
    var conclaveSum = 0;

    if (isUndefined(max)) return null;
    max!.rewards
        .filter((e) => e.RewardType !== 3)
        .forEach((reward) => {
            conclaveSum += reward.RewardAmount ?? 0;
        });

    for (i = 0; i < rewards.length; i++) {
        let newSum = 0;
        var newMax = rewards[i].rewards.find((e) => e.RewardType !== 3);
        if (isUndefined(newMax)) continue;

        rewards[i]!.rewards.filter((e) => e.RewardType !== 3).forEach((reward) => {
            newSum += reward.RewardAmount ?? 0;
        });

        if (newSum > conclaveSum) {
            conclaveSum = newSum;
            max = rewards[i];
        }
    }

    return conclaveSum == 0 ? null : rewards.indexOf(max!);
};

export const getIdxSmallestConclaveReward = (rewards: Array<PendingReward>): number => {
    var i;
    var max = rewards.find((reward) => reward.rewards.find((e) => e.RewardType !== 3) !== undefined);
    var conclaveSum = 0;

    if (isUndefined(max)) return -1;
    max!.rewards
        .filter((e) => e.RewardType !== 3)
        .forEach((reward) => {
            conclaveSum += reward.RewardAmount ?? 0;
        });

    for (i = 0; i < rewards.length; i++) {
        let newSum = 0;
        var newMax = rewards[i].rewards.find((e) => e.RewardType !== 3);
        if (isUndefined(newMax)) continue;

        rewards[i]!.rewards.filter((e) => e.RewardType !== 3).forEach((reward) => {
            newSum += reward.RewardAmount ?? 0;
        });

        if (newSum < conclaveSum) {
            conclaveSum = newSum;
            max = rewards[i];
        }
    }

    return conclaveSum == 0 ? -1 : rewards.indexOf(max!);
};

export function removeLargestConclaveReward(rewards: Array<PendingReward>) {
    var idxMax = getIdxLargestConclaveReward(rewards);
    if (idxMax == null) return rewards;

    rewards.splice(idxMax, 1);
    return rewards;
}

export function removeLargestLovelaceReward(rewards: Array<PendingReward>) {
    var idxMax = getIdxLargestLovelaceReward(rewards);

    rewards.splice(idxMax, 1);
}

export function addSmallestConclaveReward(currentBatch: Array<PendingReward>, reserveBatch: Array<PendingReward>) {
    var idxMin = getIdxSmallestConclaveReward(reserveBatch);
    if (idxMin === -1) return { currentBatch, reserveBatch };

    currentBatch.push(reserveBatch[idxMin!]);
    reserveBatch.splice(idxMin!, 1);
}

export function addSmallestLovelaceReward(currentBatch: Array<PendingReward>, reserveBatch: Array<PendingReward>) {
    var idxMin = getIdxSmallestLovelaceReward(reserveBatch);
    if (isNull(idxMin)) return { currentBatch, reserveBatch };

    currentBatch.push(reserveBatch[idxMin!]);
    reserveBatch.splice(idxMin!, 1);
}

export function removeLastItem(array: Array<any>) {
    array.splice(-1);
}

export const shuffleArray = (array: Array<any>): Array<any> => {
    let currentIndex = array.length,
        randomIndex;

    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }

    return array;
};

export function appendToList(list: Array<any>, item: any) {
    list.push(item);
}

export function filterUTXOsInWallet(utxosInWallet: Array<TxBodyInput>, addedUTXO: TxBodyInput) {
    let index = utxosInWallet.indexOf(
        utxosInWallet.find((e) => e.txHash === addedUTXO!.txHash && e.outputIndex === addedUTXO!.outputIndex)!
    );

    if (index > -1) {
        utxosInWallet.splice(index, 1);
    }

    return utxosInWallet;
}

export function addSmallestConclaveOrSmallestLovelaceReward(
    currentOutputBatch: Array<PendingReward>,
    reserveBatch: Array<PendingReward>,
    currentInputBatch: Array<TxBodyInput>,
    policyId: string
) {
    let idxMin = getIdxSmallestConclaveReward(reserveBatch);
    let minConclaveReward = reserveBatch[idxMin];
    if (
        isOutputSumLarger(
            conclaveOutputSum([...currentOutputBatch, minConclaveReward]),
            conclaveInputSum(currentInputBatch, policyId)
        ) &&
        !isZero(purelovelaceOutputSum(reserveBatch))
    ) {
        addSmallestLovelaceReward(currentOutputBatch, reserveBatch);
    } else {
        addSmallestConclaveReward(currentOutputBatch, reserveBatch);
    }
}
