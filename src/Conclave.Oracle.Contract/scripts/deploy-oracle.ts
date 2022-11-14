import { ethers } from 'hardhat';
import config from '../config.json';
import { writeFileSync } from 'fs';
import chalk from 'chalk';

async function main() {
    try {
        const Oracle = await ethers.getContractFactory('ConclaveOracle');
        const token = await ethers.getContractAt('Token', config.tokenAddress);
        const decimal = await token.decimals();

        const minValidatorStake = ethers.utils.parseUnits('10000', decimal);
        const jobAcceptanceLimitInSeconds = 60; // 1 minute
        const jobFulFillmentLimitInSeconds = 60; // 1 minute per Number
        const slashingAmount = ethers.utils.parseUnits('1000', decimal);
        const minAdaStakingRewards = ethers.utils.parseEther('10');
        const minTokenStakingRewards = ethers.utils.parseUnits('10000', decimal);

        console.log(
            chalk.yellow(`Deploying oracle contract: \nToken: ${chalk.blue(
                token.address
            )}\nminValidatorStake: ${chalk.blue(
                minValidatorStake.toString()
            )}\njobAcceptanceLimitInSeconds: ${chalk.blue(
                jobAcceptanceLimitInSeconds.toString()
            )}\njobFulFillmentLimitInSeconds: ${chalk.blue(
                jobFulFillmentLimitInSeconds.toString()
            )}\nslashingAmount: ${chalk.blue(slashingAmount.toString())}\nminAdaStakingRewards: ${chalk.blue(
                minAdaStakingRewards.toString()
            )}\nminTokenStakingRewards: ${chalk.blue(minTokenStakingRewards.toString())}
    `)
        );

        const oracle = await Oracle.deploy(
            token.address,
            minValidatorStake,
            jobAcceptanceLimitInSeconds,
            jobFulFillmentLimitInSeconds,
            slashingAmount,
            minAdaStakingRewards,
            minTokenStakingRewards
        );

        console.log(chalk.green(`Oracle successfully deployed to: ${chalk.blue(oracle.address)} \n\n`));

        config.oracleAddress = oracle.address;
        writeFileSync('./config.json', JSON.stringify(config, null, 2));
    } catch (err) {
        console.log(chalk.red('Token contract not found on this network.'));
        process.exit(1);
    }
}

main();
