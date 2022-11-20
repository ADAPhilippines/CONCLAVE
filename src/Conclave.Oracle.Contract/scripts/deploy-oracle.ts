import { ethers } from 'hardhat';
import config from '../config.json';
import { writeFileSync } from 'fs';
import chalk from 'chalk';

async function main() {
    try {
        const Oracle = await ethers.getContractFactory('ConclaveOracle');
        const token = await ethers.getContractAt('Token', config.tokenAddress);
        const decimal = await token.decimals();

        const minValidatorTokenStake = ethers.utils.parseUnits('10000', decimal);
        const minValidatorAdaStake = ethers.utils.parseEther('500');
        const jobAcceptanceLimitInSeconds = 60; // 1 minute
        const jobFulFillmentLimitInSeconds = 60; // 1 minute per Number
        const minAdaStakingRewards = ethers.utils.parseEther('10');
        const minTokenStakingRewards = ethers.utils.parseUnits('10000', decimal);

        console.log(
            chalk.yellow(`Deploying oracle contract: \nToken: ${chalk.blue(
                token.address
            )}\nminValidatorTokenStake: ${chalk.blue(
                minValidatorTokenStake.toString()
            )}\nminValidatorAdaStake: ${chalk.blue(
                minValidatorAdaStake.toString()
            )}\njobAcceptanceLimitInSeconds: ${chalk.blue(
                jobAcceptanceLimitInSeconds.toString()
            )}\njobFulFillmentLimitInSeconds: ${chalk.blue(
                jobFulFillmentLimitInSeconds.toString()
            )}\nminTokenStakingRewards: ${chalk.blue(minTokenStakingRewards.toString())}`)
        );

        const oracle = await Oracle.deploy(
            token.address,
            minValidatorAdaStake,
            minValidatorTokenStake,
            minAdaStakingRewards,
            minTokenStakingRewards,
            jobAcceptanceLimitInSeconds,
            jobFulFillmentLimitInSeconds,
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
