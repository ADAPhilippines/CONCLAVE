import { BlockFrostAPI, BlockfrostServerError, Responses } from '@blockfrost/blockfrost-js';
import CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import { fromHex } from './string-utils';
import { CardanoAssetResponse, TxBodyInput, UTXO } from '../types/response-types';
import { Reward } from '../types/database-types';
import { blockfrostAPI, shelleyChangeAddress } from './transaction-utils';
import { getInputAssetUTXOSum } from './sum-utils';

export const getUtxosAsync = async (blockfrostApi: BlockFrostAPI, publicAddr: string) => {
    const utxosResults = await blockfrostApi.addressesUtxosAll(publicAddr);

    let utxos: CardanoWasm.TransactionUnspentOutput[] = [];

    for (const utxoResult of utxosResults) {
        utxos.push(
            CardanoWasm.TransactionUnspentOutput.new(
                CardanoWasm.TransactionInput.new(
                    CardanoWasm.TransactionHash.from_bytes(fromHex(utxoResult.tx_hash)),
                    utxoResult.output_index
                ),
                CardanoWasm.TransactionOutput.new(
                    CardanoWasm.Address.from_bech32(publicAddr), // use own address since blockfrost does not provide
                    amountToValue(utxoResult.amount)
                )
            )
        );
    }
    return utxos;
};

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
};

export const assetValue = (lovelaceAmt: CardanoWasm.BigNum, policyIdHex: string, assetNameHex: string, amount: CardanoWasm.BigNum) => {
    const value = CardanoWasm.Value.new(lovelaceAmt);
    const ma = CardanoWasm.MultiAsset.new();
    const assets = CardanoWasm.Assets.new();

    assets.insert(CardanoWasm.AssetName.new(fromHex(assetNameHex)), amount);

    ma.insert(CardanoWasm.ScriptHash.from_bytes(fromHex(policyIdHex)), assets);

    value.set_multiasset(ma);
    return value;
};

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
};

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
};

export const awaitChangeInUTXOAsync = async (txInputs: Array<TxBodyInput>) => {
    let txHashArray: Array<string> = [];

    txInputs.forEach((element) => {
        txHashArray.push(element.txHash);
    });

    var CheckUTX0 = setInterval(async () => {
        console.log('Waiting for utxos to update after Submissions ');
        let utxos = await queryAllUTXOsAsync(blockfrostAPI, shelleyChangeAddress.to_bech32());
        let commonHash = utxos.filter((v) => txHashArray.includes(v.tx_hash));

        if (commonHash.length === 0 || commonHash === null || commonHash === undefined) clearInterval(CheckUTX0);
    }, 10000);
};

export const getLargeUTXOs = (utxos: UTXO): {
    txInputs: Array<TxBodyInput>;
    txOutputs: Array<Reward>
} | null => {
    let txBodyInputs: Array<TxBodyInput> = [];
    let txBodyOutputs: Array<Reward> = [];
    let divider = 0;
    let remainder = 0;

    utxos.forEach((utxo) => {
        if (parseInt(utxo.amount.find(f => f.unit == "lovelace")!.quantity) > 1200000000) {
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
                outputIndex: utxo.output_index,
                asset: assetArray,
            };

            txBodyInputs.push(utxoInput);
        }
    });

    txBodyInputs = txBodyInputs.splice(0, 248);
    let utxoSum = getInputAssetUTXOSum(txBodyInputs);
    if (utxoSum == 0) return null;

    divider = parseInt((utxoSum / 2).toFixed());
    remainder = parseInt((utxoSum % 2).toFixed());

    for (let i = 0; i < 2; i++) {
        const reward: Reward = {
            id: "string",
            rewardType: 1,
            rewardAmount: divider,
            walletAddress: shelleyChangeAddress.to_bech32.toString()
        };

        txBodyOutputs.push(reward);
    }

    const reward: Reward = {
        id: "string",
        rewardType: 1,
        rewardAmount: remainder,
        walletAddress: shelleyChangeAddress.to_bech32.toString()
    };

    txBodyOutputs.push(reward);

    return { txInputs: txBodyInputs, txOutputs: txBodyOutputs };
};

export const getSmallUTXOs = (utxos: UTXO): {
    txInputs: Array<TxBodyInput>;
    txOutputs: Array<Reward>;
} | null => {
    let txBodyInputs: Array<TxBodyInput> = [];
    let txBodyOutputs: Array<Reward> = [];

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
                outputIndex: utxo.output_index,
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
        rewardType: 1,
        rewardAmount: utxoSum,
        walletAddress: shelleyChangeAddress.to_bech32.toString()
    };

    txBodyOutputs.push(reward);

    return { txInputs: txBodyInputs, txOutputs: txBodyOutputs };
};