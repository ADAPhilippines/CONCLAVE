import chalk from 'chalk';
import { ethers } from 'hardhat';
import config from '../config.json';

async function main() {
    try {
        const consumer = await ethers.getContractAt('OracleConsumer', config.consumerAddress);
        const token = await ethers.getContractAt('Token', config.tokenAddress);
        console.log(chalk.yellow(`Approving oracle contract to spend in behalf of consumer contract`));
        const approve = await consumer.approve();
        await approve.wait();
        console.log(
            chalk.green(
                `\nOracle contract successfully approved to spend in behalf of consumer contract\n${chalk.yellow(
                    'Allowance:'
                )}: ${chalk.blue(await token.allowance(consumer.address, config.oracleAddress))}\n\n`
            )
        );
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

main();
