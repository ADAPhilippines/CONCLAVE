import { ethers } from 'hardhat';
import { deployTokenFixture } from '../fixtures/token';
import { writeFileSync } from 'fs';
import config from '../config.json';
import hardhatConfig from '../hardhat.config';

async function main() {
    const { token, decimal, ticker, name, totalSupply } = await deployTokenFixture();

    const network = await ethers.provider.getNetwork();

    if (network.chainId !== hardhatConfig.networks?.hardhat?.chainId) {
        config.tokenAddress = token.address;
        config.decimal = decimal.toString();
        config.ticker = ticker;
        config.name = name;
        config.totalSupply = totalSupply.toString();
        writeFileSync('./config.json', JSON.stringify(config, null, 2));
    }
}

main();
