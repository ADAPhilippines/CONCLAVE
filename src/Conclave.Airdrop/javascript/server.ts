import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import axios from 'axios';
import { mnemonicToEntropy } from 'bip39';
import fetch from 'node-fetch';
import { getAllUnpaidAdaRewardsAsync, getAllUnpaidConclaveTokenRewardsAsync } from './utils/reward-utils';
import { fromHex } from './utils/string-utils';
import { handleTransactionAsync , divideLargeUTXOsAsync, combineSmallUTXOsAsync } from './utils/transaction-utils';
import cbor from 'cbor';

const blockfrostAPI = new BlockFrostAPI({
    projectId: process.env.PROJECT_ID as string,
    isTestnet: false
});

const main = async () => {
    // const unpaidList = await getAllUnpaidConclaveTokenRewardsAsync();
    // unpaidList.forEach((reward) => {
    //     console.log(reward);
    // });
    await handleTransactionAsync();
};

const multiAsset = CardanoWasm.MultiAsset.new();
const assets = CardanoWasm.Assets.new();
const policyString = "sampleString";
const assetString = "sampleAsset";
const assetName = CardanoWasm.AssetName.new(Buffer.from(assetString,"hex"));

const assetValue = CardanoWasm.Value.new(CardanoWasm.BigNum.from_str("2000000"));

//native token
assets.insert(assetName, CardanoWasm.BigNum.from_str("1000000"));
multiAsset.insert(CardanoWasm.ScriptHash.from_bytes(Buffer.from(policyString, "hex")) ,assets);
main();