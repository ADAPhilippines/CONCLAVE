import chalk from 'chalk';
import { ethers } from 'hardhat';
import config from '../config.json';

async function main() {
    try {
        const accounts = await ethers.getSigners();
        const oracle = await ethers.getContractAt('ConclaveOracle', config.oracleAddress);
        const token = await ethers.getContractAt('Token', config.tokenAddress);
        const decimal = await token.decimals();
    } catch (err) {
        console.log(chalk.red('Consumer contract not found on this network.'));
        console.log(err);
        process.exit(1);
    }
}

main();
