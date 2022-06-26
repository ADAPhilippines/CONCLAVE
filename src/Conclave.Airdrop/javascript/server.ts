
import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import axios from 'axios';
import { mnemonicToEntropy } from 'bip39';
import fetch from 'node-fetch';
import { getAllUnpaidAdaRewardsAsync, getAllUnpaidConclaveTokenRewardsAsync } from './utils/reward-utils';
import { fromHex } from './utils/string-utils';
import { handleTransactionAsync } from './utils/transaction-utils';
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
    // await handleTransactionAsync(unpaidList);
    await handleTransactionAsync();
};

main();
// handleTransactionAsync();
