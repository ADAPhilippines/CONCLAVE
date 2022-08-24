import { RewardTxBodyDetails, TxBodyInput, ProtocolParametersResponse, TransactionData } from '../types/response-types';
import CardanoWasm, { Block, TransactionBuilder } from '@dcspark/cardano-multiplatform-lib-nodejs';
import { createRewardTxBodyAsync, createRewardTxBodywithFee } from './txBody-utils';
import {
    isEmpty,
    isInputSumLarger,
    isNull,
    isNullOrUndefined,
    isOutputSumLarger,
    isUndefined,
    isWithinTxSizeLimit,
    isZero,
} from './boolean-utils';
import { PendingReward } from '../types/helper-types';
import { setTimeout } from 'timers/promises';
import AirdropTransactionStatus from '../enums/airdrop-transaction-status';

import {
    conclaveInputSum,
    conclaveOutputSum,
    lovelaceInputSum,
    lovelaceOutputSum,
    purelovelaceOutputSum,
} from './sum-utils';
import {
    addSmallestConclaveOrSmallestLovelaceReward,
    addSmallestConclaveReward,
    addSmallestLovelaceReward,
    getIdxSmallestConclaveReward,
    removeLargestConclaveReward,
    removeLargestLovelaceReward,
    removeLastItem,
} from './list-utils';
import { initReward, initRewardTxBodyDetails } from './type-utils';
import { Reward } from '../types/database-types';
import {
    getBlock,
    getCurrentEpochsAsync,
    getLatestBlockAsync,
    getProtocolParametersAsync,
    getTransactionData,
    submitTransactionToChain,
} from './cardano-utils';
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';

export const setTTLAsync = async (blockfrostAPI: BlockFrostAPI): Promise<number> => {
    const latestBlock = await getLatestBlockAsync(blockfrostAPI);
    const currentSlot = latestBlock.slot;

    return currentSlot! + 20 * 20; //after 20 blocks
};

export const getTransactionBuilder = (config: ProtocolParametersResponse): TransactionBuilder => {
    const linearFee = CardanoWasm.LinearFee.new(
        CardanoWasm.BigNum.from_str(config.min_fee_a.toString()),
        CardanoWasm.BigNum.from_str(config.min_fee_b.toString())
    );

    const txBuilderConfig = CardanoWasm.TransactionBuilderConfigBuilder.new()
        .fee_algo(linearFee)
        .pool_deposit(CardanoWasm.BigNum.from_str(config.poolDeposit))
        .key_deposit(CardanoWasm.BigNum.from_str(config.keyDeposit))
        .max_value_size(config.maxValueSize)
        .max_tx_size(config.maxTxSize)
        .coins_per_utxo_word(CardanoWasm.BigNum.from_str(config.coinsPerUtxoWord))
        .build();

    return CardanoWasm.TransactionBuilder.new(txBuilderConfig);
};

export const signTxBody = (
    txHash: CardanoWasm.TransactionHash,
    txBody: CardanoWasm.TransactionBody,
    signKey: CardanoWasm.PrivateKey
): CardanoWasm.Transaction | null => {
    try {
        const witnesses = CardanoWasm.TransactionWitnessSet.new();
        const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
        const vkeyWitness = CardanoWasm.make_vkey_witness(txHash, signKey);
        vkeyWitnesses.add(vkeyWitness);
        witnesses.set_vkeys(vkeyWitnesses);

        const transaction = createTxBody(txBody, witnesses);

        return transaction;
    } catch (error) {
        console.log('Error Signing Transaction body ' + error);
        return null;
    }
};

export const createTxBody = (
    txBody: CardanoWasm.TransactionBody,
    witnesses: CardanoWasm.TransactionWitnessSet
): CardanoWasm.Transaction | null => {
    try {
        const transaction = CardanoWasm.Transaction.new(txBody, witnesses);
        return transaction;
    } catch (error) {
        console.log('Error Creating Transaction body ' + error);
        return null;
    }
};

export const submitTransactionAsync = async (
    blockfrostAPI: BlockFrostAPI,
    transaction: CardanoWasm.Transaction,
    txHashString: string
): Promise<{ status: number; message: string; txHashString: string }> => {
    const MAX_NUMBER_OF_RETRIES = 30;
    let retryCount = 0;

    while (retryCount <= MAX_NUMBER_OF_RETRIES) {
        try {
            await submitTransactionToChain(blockfrostAPI, transaction.to_bytes());

            console.log('Transaction Submitted Successfully');
            return {
                status: AirdropTransactionStatus.Success,
                message: 'Submission Successful: Transaction submitted!',
                txHashString,
            };
        } catch (error) {
            const interval = parseInt((5000 * Math.random()).toFixed());
            console.log(`error submitting, retrying in ${interval} ms...\nNumber of retries: ${retryCount}`);
            console.log(error);
            await setTimeout(interval);
            retryCount++;
        }
    }

    return {
        status: AirdropTransactionStatus.New,
        message: 'Submission Error: Maximum number of retries reached',
        txHashString: '',
    };
};

export const getLatestProtocolParametersAsync = async (
    blockfrostAPI: BlockFrostAPI
): Promise<ProtocolParametersResponse> => {
    const currentEpoch = await getCurrentEpochsAsync(blockfrostAPI);
    const protocolParams = await getProtocolParametersAsync(blockfrostAPI, currentEpoch.epoch);

    return {
        min_fee_a: protocolParams.min_fee_a.toString(),
        min_fee_b: protocolParams.min_fee_b.toString(),
        poolDeposit: protocolParams.pool_deposit.toString(),
        keyDeposit: protocolParams.key_deposit.toString(),
        maxValueSize: Number(protocolParams.max_val_size) ?? 0,
        maxTxSize: protocolParams.max_tx_size,
        coinsPerUtxoWord: Number(protocolParams.coins_per_utxo_word).toString(),
    };
};

export const createAndSignTxAsync = async (
    blockfrostAPI: BlockFrostAPI,
    txBodyDetails: RewardTxBodyDetails,
    protocolParameter: any,
    signKey: CardanoWasm.PrivateKey,
    baseAddress: CardanoWasm.Address,
    policyId: string,
    assetName: string
): Promise<{
    transaction: CardanoWasm.Transaction;
    txHash: CardanoWasm.TransactionHash;
} | null> => {
    let txBodyResult = await createRewardTxBodyAsync(
        blockfrostAPI,
        txBodyDetails,
        protocolParameter,
        baseAddress,
        policyId,
        assetName,
        signKey.to_public()
    );
    if (isNull(txBodyResult)) return null;

    let txSigned = signTxBody(txBodyResult!.txHash, txBodyResult!.txBody, signKey);
    if (isNull(txSigned)) return null;

    return { transaction: txSigned!, txHash: txBodyResult!.txHash };
};

export const transactionConfirmation = async (
    blockfrostAPI: BlockFrostAPI,
    txHashString: string,
    confirmationCount: number = 20
): Promise<{ status: number; message: string; txHashString: string }> => {
    let txData: TransactionData | null = null;

    let MAX_NUMBER_OF_RETRIES = 100;
    let retryCount = 0;

    while (retryCount <= MAX_NUMBER_OF_RETRIES) {
        try {
            txData = await getTransactionData(blockfrostAPI, txHashString);
            break;
        } catch (err) {
            const interval = parseInt((15000 * Math.random()).toFixed());
            console.log(
                `Tx data not yet available for txHash: ${txHashString}, re-fetching in ${
                    (15000 + interval) / 1000
                } seconds...`
            );

            await setTimeout(15000 + interval);
        }
    }

    if (retryCount > MAX_NUMBER_OF_RETRIES) {
        return {
            status: AirdropTransactionStatus.New,
            message: 'Confirmation Error: Maximum number of retries reached',
            txHashString: '',
        };
    }

    //what if txData fails
    MAX_NUMBER_OF_RETRIES = 50;
    retryCount = 0;

    while (retryCount <= MAX_NUMBER_OF_RETRIES) {
        try {
            let block = await getBlock(blockfrostAPI, txData!.block);
            const interval = parseInt((30000 * Math.random()).toFixed());
            console.log(
                `Confirmations for txHash: ${txHashString}: ${block.confirmations}/${confirmationCount} retrying in ${
                    (interval + 20000) / 1000
                }s...`
            );

            if (block.confirmations >= confirmationCount) {
                console.log('Transaction Confirmed for ' + txHashString);
                return {
                    status: AirdropTransactionStatus.Success,
                    message: 'Confirmation Success: Transaction Confirmed',
                    txHashString,
                };
            }
            await setTimeout(20000 + interval);
        } catch (error) {
            const interval = parseInt((3000 * Math.random()).toFixed());
            console.log(
                `error in confirmation, retrying in ${
                    5000 + interval
                } ms...\nNumber of retries: ${retryCount}\n ${error}`
            );
            await setTimeout(interval + 5000);
            retryCount++;
        }
    }

    return {
        status: AirdropTransactionStatus.New,
        message: 'Confirmation Error: Maximum number of retries reached',
        txHashString: '',
    };
};

export const coinSelectionAsync = async (
    blockfrostAPI: BlockFrostAPI,
    conclaveUTXOInputs: Array<TxBodyInput>,
    conclaveBodyOutputs: Array<PendingReward>,
    protocolParameter: ProtocolParametersResponse,
    policyId: string,
    assetName: string,
    shellyChangeAddress: CardanoWasm.Address,
    verifyKey: CardanoWasm.PublicKey
): Promise<RewardTxBodyDetails | null> => {
    let currentConclaveInputsBatch: Array<TxBodyInput> = conclaveUTXOInputs;
    let currentConclaveOutputsBatch: Array<PendingReward> = [];

    let isWithinLimit = await isWithinTxSizeLimit(
        currentConclaveInputsBatch,
        currentConclaveOutputsBatch,
        protocolParameter,
        shellyChangeAddress,
        policyId,
        assetName,
        verifyKey
    );
    if (isNull(isWithinLimit)) return null;

    while (
        isWithinLimit &&
        !isOutputSumLarger(
            conclaveOutputSum(currentConclaveOutputsBatch),
            conclaveInputSum(currentConclaveInputsBatch, policyId)
        ) &&
        !isOutputSumLarger(
            lovelaceOutputSum(currentConclaveOutputsBatch) + 2_100_000,
            lovelaceInputSum(currentConclaveInputsBatch)
        )
    ) {
        if (isEmpty(conclaveBodyOutputs)) break;
        if (
            isInputSumLarger(
                conclaveInputSum(currentConclaveInputsBatch, policyId),
                conclaveOutputSum(currentConclaveOutputsBatch)
            ) &&
            isInputSumLarger(
                lovelaceInputSum(currentConclaveInputsBatch),
                lovelaceOutputSum(currentConclaveOutputsBatch) + 2_100_000
            ) &&
            !isZero(conclaveOutputSum(conclaveBodyOutputs))
        ) {
            addSmallestConclaveOrSmallestLovelaceReward(
                currentConclaveOutputsBatch,
                conclaveBodyOutputs,
                currentConclaveInputsBatch,
                policyId
            );
        } else if (
            isInputSumLarger(
                lovelaceInputSum(currentConclaveInputsBatch),
                lovelaceOutputSum(currentConclaveOutputsBatch) + 2_100_000
            ) &&
            !isZero(lovelaceOutputSum(conclaveBodyOutputs))
        ) {
            addSmallestLovelaceReward(currentConclaveOutputsBatch, conclaveBodyOutputs);
        }

        isWithinLimit = await isWithinTxSizeLimit(
            currentConclaveInputsBatch,
            currentConclaveOutputsBatch,
            protocolParameter,
            shellyChangeAddress,
            policyId,
            assetName,
            verifyKey
        );
        if (isNull(isWithinLimit)) return null;
    }
    if (isZero(lovelaceOutputSum(currentConclaveOutputsBatch))) return null;

    isWithinLimit = await isWithinTxSizeLimit(
        currentConclaveInputsBatch,
        currentConclaveOutputsBatch,
        protocolParameter,
        shellyChangeAddress,
        policyId,
        assetName,
        verifyKey
    );
    if (isNull(isWithinLimit)) return null;

    while (
        !isWithinLimit ||
        isOutputSumLarger(
            conclaveOutputSum(currentConclaveOutputsBatch),
            conclaveInputSum(currentConclaveInputsBatch, policyId)
        ) ||
        isOutputSumLarger(
            lovelaceOutputSum(currentConclaveOutputsBatch) + 2_100_000,
            lovelaceInputSum(currentConclaveInputsBatch)
        )
    ) {
        if (
            isOutputSumLarger(
                conclaveOutputSum(currentConclaveOutputsBatch),
                conclaveInputSum(currentConclaveInputsBatch, policyId)
            )
        ) {
            removeLargestConclaveReward(currentConclaveOutputsBatch);
        } else if (
            isOutputSumLarger(
                lovelaceOutputSum(currentConclaveOutputsBatch) + 2_100_000,
                lovelaceInputSum(currentConclaveInputsBatch)
            )
        ) {
            removeLargestLovelaceReward(currentConclaveOutputsBatch);
        } else removeLastItem(currentConclaveOutputsBatch);

        isWithinLimit = await isWithinTxSizeLimit(
            currentConclaveInputsBatch,
            currentConclaveOutputsBatch,
            protocolParameter,
            shellyChangeAddress,
            policyId,
            assetName,
            verifyKey
        );
        if (isNull(isWithinLimit)) return null;
    }

    if (
        isZero(lovelaceOutputSum(currentConclaveOutputsBatch)) ||
        isOutputSumLarger(
            conclaveOutputSum(currentConclaveOutputsBatch),
            conclaveInputSum(currentConclaveInputsBatch, policyId)
        ) ||
        isOutputSumLarger(
            lovelaceOutputSum(currentConclaveOutputsBatch) + 2_100_000,
            lovelaceInputSum(currentConclaveInputsBatch)
        )
    )
        return null;

    let newTxBodyDetails: RewardTxBodyDetails | null = await createRewardTxBodywithFee(
        blockfrostAPI,
        currentConclaveInputsBatch,
        currentConclaveOutputsBatch,
        lovelaceOutputSum(currentConclaveOutputsBatch),
        protocolParameter,
        shellyChangeAddress,
        policyId,
        assetName,
        verifyKey
    );
    if (isNullOrUndefined(newTxBodyDetails)) return null;

    deductRewardFees(newTxBodyDetails!);
    return newTxBodyDetails;
};

export const calculateRewardFeesAsync = async (
    blockfrostAPI: BlockFrostAPI,
    newTxBodyDetails: RewardTxBodyDetails,
    protocolParameter: ProtocolParametersResponse,
    baseAddress: CardanoWasm.Address,
    policyId: string,
    assetName: string,
    verifyKey: CardanoWasm.PublicKey
): Promise<string | null> => {
    let _txOutputs: Array<PendingReward> = [];

    const _newTxBodyDetails: RewardTxBodyDetails = initRewardTxBodyDetails(
        newTxBodyDetails.txInputs,
        newTxBodyDetails.txOutputSum
    );

    newTxBodyDetails.txOutputs.forEach((e) => {
        let _pendingReward: PendingReward = {
            stakeAddress: e.stakeAddress,
            rewards: [],
        };

        e.rewards.forEach((reward) => {
            let _reward: Reward = initReward(
                reward.Id,
                reward.RewardType === 3 ? 2_100_000 : 2,
                reward.RewardType,
                reward.WalletAddress,
                reward.StakeAddress
            );
            _pendingReward.rewards.push(_reward);
        });

        _txOutputs.push(_pendingReward);
    });
    _newTxBodyDetails.txOutputs = _txOutputs;

    let _result = await createRewardTxBodyAsync(
        blockfrostAPI,
        _newTxBodyDetails,
        protocolParameter,
        baseAddress,
        policyId,
        assetName,
        verifyKey
    );
    if (isNull(_result)) return null;

    return _result!.txBody.fee().to_str();
};

export const deductRewardFees = (txBodyDetails: RewardTxBodyDetails) => {
    let newFee = parseInt(txBodyDetails.fee) + 200;
    txBodyDetails.txOutputs.forEach((e) => {
        e.rewards.find((f) => f.RewardType == 3)!.RewardAmount = parseInt(
            (
                e.rewards.find((f) => f.RewardType == 3)!.RewardAmount -
                (newFee / txBodyDetails.txOutputSum) * e.rewards.find((f) => f.RewardType == 3)!.RewardAmount
            ).toFixed()
        );
    });
};
