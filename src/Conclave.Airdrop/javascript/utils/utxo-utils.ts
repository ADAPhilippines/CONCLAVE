import { BlockFrostAPI, BlockfrostServerError } from '@blockfrost/blockfrost-js';
import CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import { fromHex } from './string_utils';
import { CardanoAssetResponse, UTXO } from '../types/response_types';

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
