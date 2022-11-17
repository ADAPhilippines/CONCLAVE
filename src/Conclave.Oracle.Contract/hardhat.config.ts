import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

const config: HardhatUserConfig = {
    solidity: {
        version: '0.8.17',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        hardhat: {
            chainId: 31337,
        },
        milkomedaDev: {
            url: 'https://rpc-devnet-cardano-evm.c1.milkomeda.com/',
            chainId: 200101,
            accounts: [
                'f72321e418454c0023c93be951b8602345da2cfc92b77b5a6376a408fc8bb7f3',
                'cfb7a80e6e4b008c42cab77992c1b10e662fba1ad19a2a52a5032b04fa036b7c',
                'b25017596205b8ce99c82c9f8eb8bd178d41cc7aae97eb80ec0d517104f26f32',
                '1d1ee831d3b21eb250adb0d2fc6be670c6e3f2e5769e1a487688377798bf3d8c',
                'f7a7b0c5f361dfef5b96fe329f34578873f4e14a89f2ba6d05b4cc91dba3d962',
                '9c6fffe97b08dbc592a38ece31ddda9cb0c1aa50f6624af2e9c7cb2d7e52449f',
                '38c8e0e9de1c4013889a34bd90c55c55eef51f0555412616eedca99d6d0ab8ee',
                '9a2ad2f09d2dc6aa4fae245f687016590c720fed4a785ee24351e2e729d46775',
                'f5727b85a17735105208b405ad7f895c90fc28300c5b60681df0b986bee0278f',
                'eae1b782ac3188116cf42a797944697ddb44e9d61ddddd53a758114b123fb8bd',
            ],
        },
    },
};

export default config;
