import chalk from 'chalk';
import { ethers } from 'hardhat';
import config from '../config.json';

async function main() {
    try {
        const token = await ethers.getContractAt('Token', config.tokenAddress);
        const decimal = await token.decimals();

        const tokenAmount = ethers.utils.parseUnits('1000000', decimal);

        console.log(
            chalk.yellow(
                `Transferring ${ethers.utils.formatUnits(
                    tokenAmount
                )} ${await token.symbol()} to Consumer Contract: ${chalk.blue(config.consumerAddress)}`
            )
        );
        token.transfer(config.consumerAddress, tokenAmount);
        console.log(chalk.green(`Token successfully transferred!`));
        console.log('\n\n');
    } catch (err) {
        console.log(chalk.red('Token contract not found on this network.'));
        process.exit(1);
    }
}

main();
