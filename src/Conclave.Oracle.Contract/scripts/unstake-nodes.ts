import chalk from "chalk";
import { ethers } from "hardhat";
import config from "../config.json";

async function main() {
    try {
        const accounts = await ethers.getSigners();
        const oracle = await ethers.getContractAt(
            "ConclaveOracle",
            config.oracleAddress,
        );
        const token = await ethers.getContractAt('Token', config.tokenAddress);
        const isDeployed = !(await ethers.provider.getCode(config.oracleAddress) === "0x");
        if (isDeployed) {
            const decimal = await token.decimals();
            console.log(chalk.yellow(`Unstaking from Oracle Contract`));
            for (const account of accounts) {
                const stake = await oracle.getStake(account.address);
                console.log(
                    chalk.blue(account.address),
                    chalk.green('Staking BaseToken balance'),
                    chalk.blue(ethers.utils.formatEther(stake.baseToken)),
                    chalk.green('Token balance'),
                    chalk.blue(ethers.utils.formatUnits(stake.token, decimal)),
                );

                // @TODO unstaking potential issue, one zero other one not zero
                if (stake.baseToken.lte(0) || stake.token.lte(0)) {
                    console.log(chalk.yellow('Zero Balance, skipping.'));
                    continue;
                }

                const txReceipt = await oracle
                    .connect(account)
                    .unstake(stake.baseToken, stake.token);

                await txReceipt.wait();
                console.log(
                    chalk.green('Unstaked'),
                    chalk.green('BaseToken'),
                    chalk.blue(ethers.utils.formatEther(stake.baseToken)),
                    chalk.green('Token'),
                    chalk.blue(ethers.utils.formatUnits(stake.token, decimal)),
                    chalk.blue(txReceipt.hash)
                );
            }
        } else {
            console.log(chalk.yellow('Contracts are not yet deployed, skipping.'));
        }
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

main();
