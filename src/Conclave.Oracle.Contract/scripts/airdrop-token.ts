import chalk from 'chalk';
import { ethers } from 'hardhat';
import config from '../config.json';

async function main() {
    try {
        const token = await ethers.getContractAt('Token', config.tokenAddress);
        const decimal = await token.decimals();

        const tokenAmount = ethers.utils.parseUnits('100000', decimal);
        const accounts = await ethers.getSigners();

        console.log(chalk.yellow(`Airdropping tokens to ${chalk.blue(accounts.length)} accounts`));
        for (const account of accounts) {
            await token.transfer(account.address, tokenAmount);
            console.log(
                chalk.green(
                    `Airdropped ${chalk.blue(ethers.utils.formatUnits(tokenAmount, decimal))} to ${chalk.blue(
                        account.address
                    )}`
                )
            );
        }

        console.log('\n\n');
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

main();
