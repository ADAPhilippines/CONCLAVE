import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import axios from 'axios';
import { mnemonicToEntropy } from 'bip39';
import fetch from 'node-fetch';
import { getAllUnpaidAdaRewardsAsync, getAllUnpaidConclaveTokenRewardsAsync } from './utils/reward-utils';
import { sendRewardTransactionAsync, sendTokenTransactionAsync } from './utils/transaction-utils';
import { getUtxosWithAsset } from './utils/utxo-utils';

const blockfrostAPI = new BlockFrostAPI({
    projectId: process.env.PROJECT_ID as string,
    isTestnet: true,
});

const main = async () => {
    // const unpaidList = await getAllUnpaidConclaveTokenRewardsAsync();
    // // unpaidList.forEach((reward) => {
    // //     console.log(reward);
    // // });

    // const utxosWithAsset = await getUtxosWithAsset(
    //     blockfrostAPI,
    //     process.env.BASE_ADDRESS as string,
    //     '6b8d07d69639e9413dd637a1a815a7323c69c86abbafb66dbfdb1aa7'
    // );

    // console.log({ utxosWithAsset });
    // await sendTokenTransactionAsync(); //Send conclave tokens
    await sendRewardTransactionAsync();
};

main();