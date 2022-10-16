import { Reward } from '../types/database-types';
import { ProtocolParametersResponse, RewardTxBodyDetails, TxBodyInput } from '../types/response-types';
import { lovelaceOutputSum } from './sum-utils';
import { setRewardTxBodyDetailsAsync } from './txBody-utils';
import { initReward, initRewardTxBodyDetails } from './type-utils';
import { PendingReward } from '../types/helper-types';
import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';

export const isNull = (item: any | null): boolean => {
    if (item === null) return true;
    else return false;
};

export const isUndefined = (item: any | undefined): boolean => {
    if (item === undefined) return true;
    else return false;
};

export const isNullOrUndefined = (item: any | null | undefined): boolean => {
    if (item === null || item === undefined) return true;
    else return false;
};

export const isEmpty = (batch: Array<any>): boolean => {
    if (batch.length <= 0) return true;
    else return false;
};

export const isWithinTxSizeLimit = async (
    txInputs: Array<TxBodyInput>,
    txOutputs: Array<PendingReward>,
    protocolParameters: ProtocolParametersResponse,
    shellyChangeAddress: CardanoWasm.Address,
    policyId: string,
    assetName: string,
    verifyKey: CardanoWasm.PublicKey
): Promise<boolean | null> => {
    let outputSum = lovelaceOutputSum(txOutputs);
    try {
        let _txOutputs: Array<PendingReward> = [];
        let _newTxBodyDetails: RewardTxBodyDetails = initRewardTxBodyDetails(txInputs, outputSum);

        txOutputs.forEach((e) => {
            let _pendingReward: PendingReward = {
                stakeAddress: e.stakeAddress,
                rewards: [],
            };

            e.rewards.forEach((reward) => {
                let _reward: Reward = initReward(
                    reward.Id,
                    reward.RewardType === 3 ? 2_100_000 : reward.RewardAmount,
                    reward.RewardType,
                    reward.WalletAddress,
                    reward.StakeAddress
                );
                _pendingReward.rewards.push(_reward);
            });

            _txOutputs.push(_pendingReward);
        });
        _newTxBodyDetails.txOutputs = _txOutputs;

        let txBuilder = await setRewardTxBodyDetailsAsync(
            _newTxBodyDetails,
            protocolParameters,
            policyId,
            assetName,
            verifyKey
        );
        if (txBuilder === null) return null;

        txBuilder.add_change_if_needed(shellyChangeAddress);

        if (txBuilder.full_size() > 16384) return false;

        return true;
    } catch (error) {
        console.log(`Rebuilding Transaction`);
        return false;
    }
};

export const isOutputSumLarger = (outputSum: number, inputSum: number): boolean => inputSum < outputSum;

export const isZero = (number: number): boolean => {
    if (number <= 0) return true;
    else return false;
};

export const isInputSumLarger = (inputSum: number, outputSum: number): boolean => outputSum <= inputSum;
