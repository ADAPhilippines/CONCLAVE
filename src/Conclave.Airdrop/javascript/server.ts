import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import axios from 'axios';
import fetch from 'node-fetch';
import { getAllUnpaidAdaRewardsAsync, getAllUnpaidConclaveTokenRewardsAsync } from './utils/reward-utils';
import { combineSmallUTXOsAsync, divideLargeUTXOsAsync, handleTransactionAsync } from './utils/transaction-utils';

const blockfrostAPI = new BlockFrostAPI({
    projectId: process.env.PROJECT_ID as string,
    isTestnet: true
});

const main = async () => {
    const unpaidList = await getAllUnpaidConclaveTokenRewardsAsync();
    unpaidList.forEach((reward) => {
        console.log(reward);
    });
};

const airDropTransaction = async () => {
    await divideLargeUTXOsAsync();
    await combineSmallUTXOsAsync();
    await handleTransactionAsync();
}

main();

// airDropTransaction()
