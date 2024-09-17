import chalk from 'chalk';
import { writeFileSync } from 'fs';
import { ethers } from 'hardhat';
import config from '../config.json';

async function main() {
    try {
        const token = await ethers.getContractAt('Token', config.tokenAddress);
        const oracle = await ethers.getContractAt('ConclaveOracle', config.oracleAddress);
        console.log(chalk.yellow(`Deploying consumer contract`));
        const Consumer = await ethers.getContractFactory('OracleConsumer');
        const consumer = await Consumer.deploy(oracle.address, token.address);
        await consumer.deployed();
        console.log(chalk.green(`\nConsumer contract successfully deployed to: ${chalk.blue(consumer.address)}\n\n`));
        config.consumerAddress = consumer.address;
        writeFileSync('./config.json', JSON.stringify(config, null, 2));
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

main();
