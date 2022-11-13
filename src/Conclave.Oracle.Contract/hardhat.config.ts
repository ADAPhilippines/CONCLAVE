import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

const config: HardhatUserConfig = {
    solidity: '0.8.17',
    networks: {
        hardhat: {},
        milkomeda: {
            url: process.env.MILKOMEDA_TESTNET_URL,
            chainId: Number(process.env.MILKOMEDA_TESTNET_CHAIN_ID),
            accounts: [
                process.env.MILKOMEDA_ACCT_1_PRIVATE_KEY as string,
                process.env.MILKOMEDA_ACCT_2_PRIVATE_KEY as string,
                process.env.MILKOMEDA_ACCT_3_PRIVATE_KEY as string,
                process.env.MILKOMEDA_ACCT_4_PRIVATE_KEY as string,
                process.env.MILKOMEDA_ACCT_5_PRIVATE_KEY as string,
                process.env.MILKOMEDA_ACCT_6_PRIVATE_KEY as string,
                process.env.MILKOMEDA_ACCT_7_PRIVATE_KEY as string,
                process.env.MILKOMEDA_ACCT_8_PRIVATE_KEY as string,
                process.env.MILKOMEDA_ACCT_9_PRIVATE_KEY as string,
                process.env.MILKOMEDA_ACCT_10_PRIVATE_KEY as string,
            ],
        },
    },
};

export default config;
