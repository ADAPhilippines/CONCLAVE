import { ethers } from 'hardhat';
import chalk from 'chalk';
import config from '../config.json';
import hardhatConfig from '../hardhat.config';
import { airdropTokenFixture } from './token';

export async function deployOracleFixture() {
    const [deployer] = await ethers.getSigners();
    const Oracle = await ethers.getContractFactory('ConclaveOracle');

    let token, decimal;
    const network = await ethers.provider.getNetwork();

    if (hardhatConfig.networks?.hardhat?.chainId === network.chainId) {
        const { token: _token, decimal: _decimal } = await airdropTokenFixture();
        token = _token;
        decimal = _decimal;
    } else {
        try {
            token = await ethers.getContractAt('Token', config.tokenAddress);
            decimal = await token.decimals();
        } catch (err) {
            console.log(chalk.red('Token contract not found on this network.'));
            process.exit(1);
        }
    }

    const minValidatorStake = ethers.utils.parseUnits('10000', decimal);
    const jobAcceptanceLimitInSeconds = 60; // 1 minute
    const jobFulFillmentLimitInSeconds = 60; // 1 minute per Number
    const slashingAmount = ethers.utils.parseUnits('1000', decimal);
    const minAdaStakingRewards = ethers.utils.parseEther('10');
    const minTokenStakingRewards = ethers.utils.parseUnits('10000', decimal);

    console.log(
        chalk.yellow(`Deploying oracle contract: \nToken: ${chalk.blue(token.address)}\nminValidatorStake: ${chalk.blue(
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
    return { deployer, oracle };
}
