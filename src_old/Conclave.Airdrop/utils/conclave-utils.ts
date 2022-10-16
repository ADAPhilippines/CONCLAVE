import { AirdropBatch, ProtocolParametersResponse, TxBodyInput } from '../types/response-types';
import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';
import { displayUTXOs, getAllUTXOsAsync, partitionUTXOs, queryAllUTXOsAsync } from './utxo-utils';
import { isNull } from './boolean-utils';
import {
    coinSelectionAsync,
    createAndSignTxAsync,
    getLatestProtocolParametersAsync,
    submitTransactionAsync,
    transactionConfirmation,
} from './transaction-utils';
import { conclaveOutputSum, getInputAssetUTXOSum, lovelaceOutputSum } from './sum-utils';
import { toHex } from './string-utils';
import AirdropTransactionStatus from '../enums/airdrop-transaction-status';
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import AirdropWorker from '../models/AirdropWorker';
import ConclaveAirdropper from '../models/ConclaveAirdropper';
import { PendingReward } from '../types/helper-types';
import { generateWorkerBatchesWithThreshold } from './worker-utils';
import { setTimeout } from 'timers/promises';

export const divideUTXOsAsync = async (
    blockfrostAPI: BlockFrostAPI,
    protocolParameter: ProtocolParametersResponse,
    lovelaceThreshold: number = 500_000_000,
    conclaveThreshold: number = 200_000_000,
    policyId: string,
    assetName: string,
    shellyChangeAddress: CardanoWasm.Address,
    signingKey: CardanoWasm.PrivateKey
) => {
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, shellyChangeAddress.to_bech32());

    console.log('Dividing UTXOs...');
    if (isNull(utxos)) return;

    let rewards = partitionUTXOs(utxos!, lovelaceThreshold, conclaveThreshold, policyId, shellyChangeAddress);
    if (rewards === null || rewards.txInputs === null || rewards.txOutputs === null)
        return console.log('No UTXOs to divide. Proceeding to sending transaction.');

    let txInputOutputs = await coinSelectionAsync(
        blockfrostAPI,
        rewards.txInputs,
        rewards.txOutputs,
        protocolParameter,
        policyId,
        assetName,
        shellyChangeAddress,
        signingKey.to_public()
    );
    if (txInputOutputs == null || txInputOutputs === undefined) return;

    console.log('<-----Details Divider Details----->');
    txInputOutputs?.txInputs.forEach((e, i) => {
        console.log(
            'Txinput #' +
                i +
                ' ' +
                e.txHash +
                ' ' +
                e.asset.find((f) => f.unit == 'lovelace')!.quantity +
                ' ' +
                e.asset.find((f) => f.unit == 'lovelace')!.unit
        );
    });
    console.log('TxInputLovelace sum: ' + getInputAssetUTXOSum(txInputOutputs!.txInputs));
    console.log('TxInputConclave sum: ' + getInputAssetUTXOSum(txInputOutputs!.txInputs, policyId));
    console.log('ConclaveOutput sum: ' + conclaveOutputSum(txInputOutputs!.txOutputs));
    console.log('LovelaceOutput sum: ' + lovelaceOutputSum(txInputOutputs!.txOutputs));
    console.log('TxOutput count: ' + txInputOutputs!.txOutputs.length);
    console.log('<-----End of UTXO Divider Details----->');

    let transaction = await createAndSignTxAsync(
        blockfrostAPI,
        txInputOutputs,
        protocolParameter,
        signingKey,
        shellyChangeAddress,
        policyId,
        assetName
    );
    if (transaction == null) return;

    console.log('Dividing Large UTXOs');
    console.log(
        'Transaction ' + toHex(transaction.txHash.to_bytes()) + ' fee ' + transaction.transaction.body().fee().to_str()
    );

    //Submit Transaction
    let txHashString = toHex(transaction.txHash.to_bytes());

    let submitResult = await submitTransactionAsync(blockfrostAPI, transaction!.transaction, txHashString);
    if (submitResult!.status != AirdropTransactionStatus.Success) {
        return;
    }

    await transactionConfirmation(blockfrostAPI, txHashString, 20);
    return;
};

export const startAirdropper = async (
    blockfrostAPI: BlockFrostAPI,
    newPendingRewards: PendingReward[],
    inProgressPendingRewards: PendingReward[],
    baseAddress: CardanoWasm.Address,
    signingKey: CardanoWasm.PrivateKey,
    conclavePolicyId: string
): Promise<void> => {
    let protocolParameter = await getLatestProtocolParametersAsync(blockfrostAPI);

    const asset = await blockfrostAPI.assetsById(process.env.ASSET_ID as string);
    console.log(asset);

    // Divide UTXOs
    // await divideUTXOsAsync(
    //     blockfrostAPI,
    //     protocolParameter,
    //     2 * 1_000_000,
    //     1,
    //     conclavePolicyId,
    //     asset.asset_name as string,
    //     baseAddress,
    //     signingKey
    // );

    // Display UTXOs
    let utxos = await queryAllUTXOsAsync(blockfrostAPI, baseAddress.to_bech32());
    await displayUTXOs(utxos!);

    let utxosInWallet: Array<TxBodyInput> = await getAllUTXOsAsync(blockfrostAPI, baseAddress.to_bech32());
    console.log('UTXOs in wallet: ' + utxosInWallet.length);
    // Divide pending rewards into batches
    let airdropBatches: Array<AirdropBatch> = await generateWorkerBatchesWithThreshold(
        utxosInWallet,
        newPendingRewards,
        inProgressPendingRewards,
        20,
        undefined,
        undefined,
        conclavePolicyId
    );

    //initialize workers
    const conclaveAirdropper = new ConclaveAirdropper(10);

    let index = 0;
    for (let airdropBatch of airdropBatches) {
        airdropBatch.index = ++index;
        await executeAirdropWorkerAsync(
            conclaveAirdropper,
            airdropBatch,
            protocolParameter,
            conclavePolicyId,
            asset.asset_name as string,
            baseAddress,
            signingKey,
            process.env.PROJECT_ID as string
        );
    }
};

// helpers
export const executeAirdropWorkerAsync = async (
    conclaveAirdropper: ConclaveAirdropper,
    batch: AirdropBatch,
    protocolParameter: ProtocolParametersResponse,
    policyId: string,
    assetName: string,
    baseAddress: CardanoWasm.Address,
    signingKey: CardanoWasm.PrivateKey,
    blockfrostProjectId: string
): Promise<void> => {
    let airdropWorker: AirdropWorker | null = null;

    while (airdropWorker === null) {
        airdropWorker = conclaveAirdropper.getFirstAvailableWorker();

        if (isNull(airdropWorker)) {
            console.log('waiting available worker');
            await setTimeout(1000 * 60 * 2); // wait 2 minutes
            continue;
        }
        airdropWorker!.execute(
            batch,
            protocolParameter,
            policyId,
            assetName,
            baseAddress,
            signingKey,
            blockfrostProjectId
        );
        break;
    }
};
