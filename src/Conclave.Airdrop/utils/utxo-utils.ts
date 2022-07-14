import { BlockFrostAPI, BlockfrostServerError, Responses } from '@blockfrost/blockfrost-js';
import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';
import { fromHex, toHex } from './string-utils';
import { CardanoAssetResponse, RewardTxBodyDetails, TxBodyInput, UTXO } from '../types/response-types';
import { Reward } from '../types/database-types';
import { submitTransactionAsync, waitNumberOfBlocks } from './transaction-utils';
import { getInputAssetUTXOSum } from './sum-utils';
import { isNull, isZero } from './boolean-utils';
import { blockfrostAPI } from '../config/network.config';
import { shelleyChangeAddress } from '../config/walletKeys.config';
import { PendingReward } from '../types/helper-types';
import { setTimeout } from 'timers/promises';
import { parentPort } from 'worker_threads';

export const getUtxosAsync = async (blockfrostApi: BlockFrostAPI, publicAddr: string) => {
    const utxosResults = await blockfrostApi.addressesUtxosAll(publicAddr);

    let utxos: CardanoWasm.TransactionUnspentOutput[] = [];

    for (const utxoResult of utxosResults) {
        utxos.push(
            CardanoWasm.TransactionUnspentOutput.new(
                CardanoWasm.TransactionInput.new(
                    CardanoWasm.TransactionHash.from_bytes(fromHex(utxoResult.tx_hash)),
                    CardanoWasm.BigNum.from_str(utxoResult.output_index.toString())
                ),
                CardanoWasm.TransactionOutput.new(
                    CardanoWasm.Address.from_bech32(publicAddr), // use own address since blockfrost does not provide
                    amountToValue(utxoResult.amount)
                )
            )
        );
    }
    return utxos;
}

export const amountToValue = (amount: CardanoAssetResponse[]) => {
    var lovelaceAmt = amount.find((a) => a.unit == 'lovelace') as CardanoAssetResponse;
    var val = CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(lovelaceAmt.quantity));
    for (const asset of amount.filter((a) => a.unit != 'lovelace')) {
        val = val.checked_add(
            assetValue(
                CardanoWasm.BigNum.from_str('0'),
                asset.unit.substring(0, 56),
                asset.unit.substring(56),
                CardanoWasm.BigNum.from_str(asset.quantity)
            ) as CardanoWasm.Value
        );
    }
    return val;
}

export const assetValue = (lovelaceAmt: CardanoWasm.BigNum, policyIdHex: string, assetNameHex: string, amount: CardanoWasm.BigNum) => {
    const value = CardanoWasm.Value.new(lovelaceAmt);
    const ma = CardanoWasm.MultiAsset.new();
    const assets = CardanoWasm.Assets.new();

    assets.insert(CardanoWasm.AssetName.new(fromHex(assetNameHex)), amount);

    ma.insert(CardanoWasm.ScriptHash.from_bytes(fromHex(policyIdHex)), assets);

    value.set_multiasset(ma);
    return value;
}

export const queryAllUTXOsAsync = async (blockfrostApi: BlockFrostAPI, address: string): Promise<UTXO> => {
    let utxos: UTXO = [];
    try {
        utxos = await blockfrostApi.addressesUtxosAll(address);
    } catch (error) {
        if (error instanceof BlockfrostServerError && error.status_code === 404) {
            utxos = [];
        } else {
            throw error;
        }
    }

    if (utxos.length === 0) {
        console.log();
        console.log(`You should send ADA to ${address} to have enough funds to sent a transaction`);
        console.log();
    }
    return utxos;
}

export const getUtxosWithAsset = async (blockfrostApi: BlockFrostAPI, address: string, unit: string): Promise<UTXO> => {
    let utxos: UTXO = await blockfrostApi.addressesUtxosAll(address);
    let utxosWithAsset: UTXO = [];

    if (utxos.length < 0) return utxos;

    for (let utxo of utxos) {
        for (let amount of utxo.amount) {
            if (amount.unit !== unit) continue;
            utxosWithAsset.push(utxo);
            break;
        }
    }

    return utxosWithAsset;
}

export const getPureAdaUtxos = async (blockfrostApi: BlockFrostAPI, address: string): Promise<UTXO> => {
    let utxos: UTXO = await blockfrostApi.addressesUtxosAll(address);
    if (utxos.length < 0) return utxos;

    let pureAdaUtxos: UTXO = [];

    for (let utxo of utxos) {
        var pureAda = true;
        for (let amount of utxo.amount) {
            if (amount.unit !== "lovelace") pureAda = false;
            break;
        }

        if (pureAda) pureAdaUtxos.push(utxo);
    }

    return pureAdaUtxos;
};

export const awaitChangeInUTXOAsync = async (
    txHash: CardanoWasm.TransactionHash,
    transaction: CardanoWasm.Transaction,
    txItem: RewardTxBodyDetails,
    worker: number,
    index: number): Promise<{ currentIndex: number, status: string }> => {
    let maxSlot = 0;

    for (let i = 0; i < 30; i++) {
        let randomInterval = parseInt((3000 * Math.random()).toFixed());
        try {
            let latestBlock = await blockfrostAPI.blocksLatest();
            let currentSlot = latestBlock.slot;
            maxSlot = currentSlot! + 20 * 20;
            break;
        } catch (error) {
            console.log('WORKER# ' + worker + " " + "Failed to get latestBlock retrying...")
        }
        await setTimeout(2000 + randomInterval);
    }
    if (maxSlot === 0) return { currentIndex: index, status: "failed" };

    for (let v = 0; v < 50; v++) {
        let randomInterval = parseInt((10000 * Math.random()).toFixed());
        console.log('WORKER# ' + worker + " " + "Awaiting for change in utxo for txhash " + toHex(txHash.to_bytes()));

        try {
            let latestBlock = await blockfrostAPI.blocksLatest();
            let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
            let commonHash = utxos.find(u => u.tx_hash === toHex(txHash.to_bytes()));

            if (commonHash !== undefined && (latestBlock.slot != null && latestBlock.slot <= maxSlot)) {
                return await getCurrentSlot(txHash, worker, index);
            } else if ((latestBlock.slot != null && latestBlock.slot > maxSlot) && (commonHash === undefined)) {
                return await submitTransactionAsync(transaction, txHash, txItem, worker, index);
            }
        } catch (error) {
            console.log('WORKER# ' + worker + " " + "Failed to get utxos retrying...")
        }

        await setTimeout(30000 + randomInterval);
    }
    return { currentIndex: index, status: "failed" };
}

export const getCurrentSlot = async (txHash: CardanoWasm.TransactionHash, worker: number, index: number): Promise<{ currentIndex: number, status: string }> => {
    for (let i = 0; i < 30; i++) {
        let randomInterval = parseInt((2000 * Math.random()).toFixed());
        try {
            let latestBlock = await blockfrostAPI.blocksLatest();
            if (!isNull(latestBlock) && !isNull(latestBlock.slot)) {
                return await waitNumberOfBlocks(txHash, latestBlock.slot! + 20 * 20, worker, index);
            }
        } catch (error) {
            console.log('WORKER# ' + worker + " " + "Failed to get latestBlock retrying...")
        }
        await setTimeout(2000 + randomInterval);
    }
    return { currentIndex: index, status: "failed" };
}

export const partitionUTXOs = (utxos: UTXO): {
    txInputs: Array<TxBodyInput>;
    txOutputs: Array<PendingReward>
} | null => {
    let txBodyInputs: Array<TxBodyInput> = [];
    let txBodyOutputs: Array<PendingReward> = [];
    let utxoDivider: number = 1;

    utxos.forEach((utxo) => {
        if (
            utxo.amount.length == 1 &&
            utxo.amount[0].unit == 'lovelace' &&
            (parseInt(utxo.amount.find(f => f.unit == "lovelace")!.quantity) > 500000000)) {

            let assetArray: Array<CardanoAssetResponse> = [];
            utxo.amount.forEach(asset => {
                const cardanoAsset: CardanoAssetResponse = {
                    unit: asset.unit,
                    quantity: asset.quantity,
                };

                assetArray.push(cardanoAsset);
            });

            const utxoInput: TxBodyInput = {
                txHash: utxo.tx_hash,
                outputIndex: utxo.output_index.toString(),
                asset: assetArray,
            };

            txBodyInputs.push(utxoInput);
        }
    });
    txBodyInputs = txBodyInputs.splice(0, 10);

    let utxoSum = getInputAssetUTXOSum(txBodyInputs);
    if (isZero(utxoSum)) return null;

    utxoDivider = parseInt((utxoSum / 251000000).toFixed());

    for (let i: number = 0; i < utxoDivider; i++) {
        const reward: Reward = {
            id: i.toString(),
            rewardType: 3,
            rewardAmount: 251000000,
            walletAddress: shelleyChangeAddress.to_bech32(),
            stakeAddress: " "
        };

        const pendingReward: PendingReward = {
            stakeAddress: " ",
            rewards: [reward],
        };

        txBodyOutputs.push(pendingReward);
    }
    return { txInputs: txBodyInputs, txOutputs: txBodyOutputs };
}

export const combineUTXOs = (utxos: UTXO): {
    txInputs: Array<TxBodyInput>;
    txOutputs: Array<PendingReward>
} | null => {
    let txBodyInputs: Array<TxBodyInput> = [];
    let txBodyOutputs: Array<PendingReward> = [];
    let utxoDivider: number = 1;

    utxos.forEach((utxo) => {
        if (
            utxo.amount.length == 1 &&
            utxo.amount[0].unit == 'lovelace' &&
            (parseInt(utxo.amount.find(f => f.unit == "lovelace")!.quantity) <= 122000000)) {

            let assetArray: Array<CardanoAssetResponse> = [];
            utxo.amount.forEach(asset => {
                const cardanoAsset: CardanoAssetResponse = {
                    unit: asset.unit,
                    quantity: asset.quantity,
                };

                assetArray.push(cardanoAsset);
            });

            const utxoInput: TxBodyInput = {
                txHash: utxo.tx_hash,
                outputIndex: utxo.output_index.toString(),
                asset: assetArray,
            };

            txBodyInputs.push(utxoInput);
        }
    });
    txBodyInputs = txBodyInputs.splice(0, 10);

    let utxoSum = getInputAssetUTXOSum(txBodyInputs);
    if (isZero(utxoSum)) return null;

    utxoDivider = parseInt((utxoSum / 251000000).toFixed());

    for (let i: number = 0; i < utxoDivider; i++) {
        const reward: Reward = {
            id: i.toString(),
            rewardType: 3,
            rewardAmount: 251000000,
            walletAddress: shelleyChangeAddress.to_bech32(),
            stakeAddress: " "
        };

        const pendingReward: PendingReward = {
            stakeAddress: " ",
            rewards: [reward],
        };

        txBodyOutputs.push(pendingReward);
    }
    return { txInputs: txBodyInputs, txOutputs: txBodyOutputs };
}
// export const getSmallUTXOs = (utxos: UTXO): {
//     txInputs: Array<TxBodyInput>;
//     txOutputs: Array<PendingReward>;
//     } | null => {
//     let txBodyInputs: Array<TxBodyInput> = [];
//     let txBodyOutputs: Array<PendingReward> = [];

//     utxos.forEach((utxo) => {
//         if (parseInt(utxo.amount.find(f => f.unit == "lovelace")!.quantity) < 300000000) {
//             let assetArray: Array<CardanoAssetResponse> = [];
//             utxo.amount.forEach(asset => {
//                 const cardanoAsset: CardanoAssetResponse = {
//                     unit: asset.unit,
//                     quantity: asset.quantity,
//                 };

//                 assetArray.push(cardanoAsset);
//             });

//             const utxoInput: TxBodyInput = {
//                 txHash: utxo.tx_hash,
//                 outputIndex: utxo.output_index.toString(),
//                 asset: assetArray,
//             };
//             txBodyInputs.push(utxoInput);
//         }
//     });

//     txBodyInputs = txBodyInputs.splice(0, 248);

//     let utxoSum = getInputAssetUTXOSum(txBodyInputs);
//     if (utxoSum === 0) return null;

//     const reward: Reward = {
//         id: "string",
//         rewardType: 3,
//         rewardAmount: utxoSum,
//         walletAddress: shelleyChangeAddress.to_bech32.toString(),
//         stakeAddress: ""
//     };

//     const pendingReward : PendingReward = {
//         stakeAddress: "string",
//         rewards: [reward]
//     };
//     txBodyOutputs.push(pendingReward);

//     return { txInputs: txBodyInputs, txOutputs: txBodyOutputs };
// }
