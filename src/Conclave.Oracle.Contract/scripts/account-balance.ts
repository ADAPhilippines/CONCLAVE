import chalk from 'chalk';
import { ethers } from 'hardhat';
import config from '../config.json';

async function main() {
    try {
        const accounts = await ethers.getSigners();
        const token = await ethers.getContractAt('Token', config.tokenAddress);
        const tokenDecimals = await token.decimals();
        accounts.map(async (acc) => {
            const baseBalance = await ethers.provider.getBalance(acc.address);
            const tokenBalance = await token.balanceOf(acc.address);
            console.log(
                chalk.blue(acc.address),
                chalk.green('BaseToken Balance:'),
                chalk.blue(ethers.utils.formatEther(baseBalance)),
                chalk.green('ERC20 Balance:'),
                chalk.blue(ethers.utils.formatUnits(tokenBalance, tokenDecimals)),
            );
        });
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

main();
