import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import { TransactionBody, TransactionBuilder } from '@emurgo/cardano-serialization-lib-nodejs';
import AirdropStatus from '../enums/airdrop-status';
import { Reward } from '../types/database-types';
import { PendingReward } from '../types/helper-types';
import { UTXO } from '../types/response-types';
import { updateRewardListStatusAsync } from './reward-utils';

export const calculateTotalAda = (pureAdaUtxos: UTXO, utxosWithAsset: UTXO): number => {
    return (
        utxosWithAsset
            .map((x) => Number(x.amount.find((u) => u.unit === 'lovelace')?.quantity))
            .reduce((acc, val) => acc + val) +
        pureAdaUtxos
            .map((u) => Number(u.amount.find((x) => x.unit === 'lovelace')?.quantity))
            .reduce((acc, val) => acc + val)
    );
};

export const calculateTotalToken = (utxosWithAsset: UTXO, assetUnit: string): number => {
    return utxosWithAsset
        .map((x) => Number(x.amount.find((u) => u.unit === (process.env.CONCLAVE_UNIT_ID as string))?.quantity))
        .reduce((acc, val) => acc + val);
};

export const spawnConclaveAirdropWorkerAsync = async (
    blockfrostAPI: BlockFrostAPI,
    utxos: UTXO,
    pendingRewards: PendingReward[],
    transacitonBuilder: TransactionBuilder
) => {
    // build transaction
    const [transactionBody, includedRewards] = await buildTransactionAsync(utxos, pendingRewards, transacitonBuilder);

    //send transaction
    const txHash = await sendPendingRewardsAsync(blockfrostAPI, transactionBody, pendingRewards);

    // update reward status
    await updateRewardListStatusAsync(includedRewards, AirdropStatus.InProgress, txHash);

    // wait for transaction confirmation
};

// Helpers

const sendPendingRewardsAsync = async (
    blockfrostAPI: BlockFrostAPI,
    data: any,
    pendingRewards: PendingReward[]
): Promise<string> => {
    return '';
};

const buildTransactionAsync = async (
    utxos: UTXO,
    pendingRewards: PendingReward[],
    transacitonBuilder: TransactionBuilder
): Promise<[number, Reward[]]> => {
    return [1, []];
};
