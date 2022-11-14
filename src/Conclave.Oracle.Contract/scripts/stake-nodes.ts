import chalk from 'chalk';
import { ethers } from 'hardhat';
import config from '../config.json';

async function main() {
    try {
        const accounts = await ethers.getSigners();
        const oracle = await ethers.getContractAt('ConclaveOracle', config.oracleAddress);
        const token = await ethers.getContractAt('Token', config.tokenAddress);
        const decimal = await token.decimals();

        for (const account of accounts) {
            const tokenBalance = await token.balanceOf(account.address);
            const formattedTokenBalance = ethers.utils.formatUnits(tokenBalance, decimal);
            console.log(`\n${chalk.blue(account.address)} has ${chalk.green(formattedTokenBalance)} tokens\n`);
            const minStake = ethers.utils.formatUnits((await oracle.s_minStake()).toString(), decimal);
            const maxStake = ethers.utils.formatUnits(await token.balanceOf(account.address), decimal);
            const amount = ethers.utils.parseUnits(
                (Math.random() * (Number(maxStake) - Number(minStake)) + Number(minStake)).toString(),
                decimal
            );
            const formattedAmount = ethers.utils.formatUnits(amount, decimal);
            console.log(chalk.yellow(`Staking ${chalk.blue(formattedAmount)} for ${chalk.blue(account.address)}...`));
            await oracle.connect(account).stake(amount);
            console.log(chalk.green(`Staked successfully!\n`));
        }
    } catch (err) {
        console.log(chalk.red('Consumer contract not found on this network.'));
        console.log(err);
        process.exit(1);
    }
}

main();
