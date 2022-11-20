import { ethers } from 'hardhat';
import config from '../config.json';
import { writeFileSync } from 'fs';
import chalk from 'chalk';

async function main() {
    try {
        const Oracle = await ethers.getContractFactory('ConclaveOracle');
        const token = await ethers.getContractAt('Token', config.tokenAddress);
        const decimal = await token.decimals();

        const minValidatorTokenStake = ethers.utils.parseUnits('100', decimal);
        const minValidatorbaseTokenStake = ethers.utils.parseEther('50');
        const jobAcceptanceLimitInSeconds = 60; // 1 minute
        const jobFulFillmentLimitInSeconds = 60; // 1 minute per Number
        const minbaseTokenStakingRewards = ethers.utils.parseEther('10');
        const minTokenStakingRewards = ethers.utils.parseUnits('10000', decimal);

        console.log(
            chalk.yellow(`Deploying oracle contract: \nToken: ${chalk.blue(
                token.address
            )}\nminValidatorTokenStake: ${chalk.blue(
                ethers.utils.formatUnits(minValidatorTokenStake, decimal)
            )}\nminValidatorBaseTokenStake: ${chalk.blue(
                ethers.utils.formatEther(minValidatorbaseTokenStake)
            )}\njobAcceptanceLimitInSeconds: ${chalk.blue(
                jobAcceptanceLimitInSeconds.toString()
            )}\njobFulFillmentLimitInSeconds: ${chalk.blue(
                jobFulFillmentLimitInSeconds.toString()
            )}\nminTokenStakingRewards: ${chalk.blue(minTokenStakingRewards.toString())}`)
        );

        const oracle = await Oracle.deploy(
            token.address,
            minValidatorbaseTokenStake,
            minValidatorTokenStake,
            minbaseTokenStakingRewards,
            minTokenStakingRewards,
            jobAcceptanceLimitInSeconds,
            jobFulFillmentLimitInSeconds,
        );

        console.log(chalk.green(`Oracle successfully deployed to: ${chalk.blue(oracle.address)} \n\n`));

        config.oracleAddress = oracle.address;
        writeFileSync('./config.json', JSON.stringify(config, null, 2));
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

main();
