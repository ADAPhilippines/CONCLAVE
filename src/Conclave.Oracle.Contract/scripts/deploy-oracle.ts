import { ethers } from 'hardhat';
import { deployOracleFixture } from '../fixtures/oracle';
import hardhatConfig from '../hardhat.config';
import config from '../config.json';
import { writeFileSync } from 'fs';

async function main() {
    const { deployer, oracle } = await deployOracleFixture();

    const network = await ethers.provider.getNetwork();

    if (network.chainId !== hardhatConfig.networks?.hardhat?.chainId) {
        config.oracleAddress = oracle.address;
        writeFileSync('./config.json', JSON.stringify(config, null, 2));
    }
}

main();
