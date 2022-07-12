import { BlockFrostAPI, BlockfrostServerError, Responses } from '@blockfrost/blockfrost-js';
import CardanoWasm from '@dcspark/cardano-multiplatform-lib-nodejs';
import { fromHex, toHex } from './string-utils';
import { CardanoAssetResponse, TxBodyInput, UTXO } from '../types/response-types';
import { Reward } from '../types/database-types';
import { waitNumberOfBlocks } from './transaction-utils';
import { getInputAssetUTXOSum } from './sum-utils';
import { isNull, isZero } from './boolean-utils';
import { blockfrostAPI } from '../config/network.config';
import { policyStr, shelleyChangeAddress } from '../config/walletKeys.config';
import { PendingReward } from '../types/helper-types';

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
    let pureAdaUtxos: UTXO = [];

    if (utxos.length < 0) return utxos;

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

export const awaitChangeInUTXOAsync = async (txHash: CardanoWasm.TransactionHash) => {
    let latestBlock = await blockfrostAPI.blocksLatest();
    let currentSlot = latestBlock.slot;
    const maxSlot = currentSlot! + 20*20;
    let randomInterval = parseInt((7000 * Math.random()).toFixed());

    var CheckUTX0 = setInterval(async () => {
        latestBlock = await blockfrostAPI.blocksLatest();
        randomInterval = parseInt((7000 * Math.random()).toFixed());
        console.log('Waiting for utxos to update after Submissions for txhash ' + toHex(txHash.to_bytes()) + '...');
        let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
        let commonHash = utxos.find(u => u.tx_hash === toHex(txHash.to_bytes()));

        if (
            commonHash !== undefined && (
                latestBlock.slot != null && 
                latestBlock.slot <= maxSlot)) {
            await getCurrentSlot(txHash);
            clearInterval(CheckUTX0);
        } else if (
            (latestBlock.slot != null && latestBlock.slot > maxSlot) && 
            (commonHash === undefined)) {
            clearInterval(CheckUTX0);
        }
    }, 20000 + randomInterval);
}

export const getCurrentSlot = async (txHash: CardanoWasm.TransactionHash) => {
    let randomInterval = parseInt((3000 * Math.random()).toFixed());

    var getSlot = setInterval(async () => {
        let latestBlock = await blockfrostAPI.blocksLatest();
        randomInterval = parseInt((3000 * Math.random()).toFixed());

        if (!isNull(latestBlock) && !isNull(latestBlock.slot)) {
            await waitNumberOfBlocks(txHash, latestBlock.slot! + 20*20);
            clearInterval(getSlot);} 
    }, 1000 + randomInterval);
}

export const partitionUTXOs = (utxos: UTXO): {
    txInputs: Array<TxBodyInput>;
    txOutputs: Array<PendingReward>
    } | null => {
    let txBodyInputs: Array<TxBodyInput> = [];
    let txBodyOutputs: Array<PendingReward> = [];
    let utxoDivider = 1;
    let conclaveDivider = 1;

    utxos.forEach((utxo) => {
        if (parseInt(utxo.amount.find(f => f.unit == "lovelace")!.quantity) > 500000000) {
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
    txBodyInputs.splice(0, 10);

    utxos.forEach((utxo) => {
        if (parseInt(utxo.amount.find(f => f.unit == policyStr)?.quantity ?? "0") > 20000000) {
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

            if (txBodyInputs.indexOf(utxoInput) != -1) return;
            txBodyInputs.push(utxoInput);
        }
    });

    let utxoSum = getInputAssetUTXOSum(txBodyInputs);
    let conclaveSum = getInputAssetUTXOSum(txBodyInputs, policyStr);

    if (isZero(utxoSum)) return null;

    utxoDivider = parseInt((utxoSum / 251000000).toFixed());
    conclaveDivider = parseInt((conclaveSum/10000000).toFixed());

    let v = 1;

    for (let i = 0; i < utxoDivider; i++) {
        const reward: Reward = {
            id: "string",
            rewardType: 3,
            rewardAmount: 251000000,
            walletAddress: shelleyChangeAddress.to_bech32(),
            stakeAddress: " "
        };

        const pendingReward: PendingReward = {
            stakeAddress: " ",
            rewards: [reward],
        }

        v++;
        txBodyOutputs.push(pendingReward);
    }
    return { txInputs: txBodyInputs, txOutputs: txBodyOutputs };
}

export const getSmallUTXOs = (utxos: UTXO): {
    txInputs: Array<TxBodyInput>;
    txOutputs: Array<PendingReward>;
    } | null => {
    let txBodyInputs: Array<TxBodyInput> = [];
    let txBodyOutputs: Array<PendingReward> = [];

    utxos.forEach((utxo) => {
        if (parseInt(utxo.amount.find(f => f.unit == "lovelace")!.quantity) < 300000000) {
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

    txBodyInputs = txBodyInputs.splice(0, 248);

    let utxoSum = getInputAssetUTXOSum(txBodyInputs);
    if (utxoSum === 0) return null;

    const reward: Reward = {
        id: "string",
        rewardType: 3,
        rewardAmount: utxoSum,
        walletAddress: shelleyChangeAddress.to_bech32.toString(),
        stakeAddress: ""
    };

    const pendingReward : PendingReward = {
        stakeAddress: "string",
        rewards: [reward]
    };
    txBodyOutputs.push(pendingReward);

    return { txInputs: txBodyInputs, txOutputs: txBodyOutputs };
}
