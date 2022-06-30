import { BlockFrostAPI } from '@blockfrost/blockfrost-js';
import CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';
import axios from 'axios';
import { mnemonicToEntropy } from 'bip39';
import fetch from 'node-fetch';
import { getAllUnpaidAdaRewardsAsync, getAllUnpaidConclaveTokenRewardsAsync } from './utils/reward-utils';
import { sendRewardTransactionAsync, sendTokenTransactionAsync } from './utils/transaction-utils';
import { getUtxosWithAsset } from './utils/utxo-utils';

const blockfrostAPI = new BlockFrostAPI({
    projectId: "testnet4Zo3x6oMtftyJH0X0uutC1RflLn8JtWR",
    isTestnet: true,
});

const main = async () => {
    // const unpaidList = await getAllUnpaidConclaveTokenRewardsAsync();
    // // unpaidList.forEach((reward) => {
    // //     console.log(reward);
    // // });

    // const utxosWithAsset = await getUtxosWithAsset(
    //     blockfrostAPI,
    //     "addr_test1vrhcq70gslwqchcerumm0uqu08zy68qg2mdmh95ar5t545c7avx8t",
    //     'b7f89333a361e0c467a4c149c9bc283c2472de5640dbd821320eca1853616d706c65546f6b656e4a0a'
    // );

    // console.log({ utxosWithAsset });
    // await sendTokenTransactionAsync(); //Send conclave tokens
    await sendRewardTransactionAsync();
};

main();