import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

export default async function fixture() {
    const { token, decimal, oracle, accounts, accountsWithTokens, accountsWithoutTokens, minValidatorStake } = await stakingFixture();

    // deploy consumer
    const Consumer = await ethers.getContractFactory('OracleConsumer');
    const consumer = await Consumer.deploy(oracle.address, token.address);

    // transfer assets to consumer
    const ethAmount = ethers.utils.parseEther('10');
    const cnclvAmount = ethers.utils.parseUnits('1000000', decimal);

    await accounts[0].sendTransaction({
        to: consumer.address,
        value: ethAmount,
    });

    token.transfer(consumer.address, cnclvAmount);

    // approvals
    await consumer.approve();
    for (const account of accountsWithTokens) {
        await token.connect(account).approve(oracle.address, ethers.constants.MaxUint256);
    }

    // stake nodes
    for (const account of accounts) {
        const minStake = ethers.utils.formatUnits((await oracle.s_minStake()).toString(), decimal);
        const maxStake = ethers.utils.formatUnits(await token.balanceOf(account.address), decimal);
        const amount = ethers.utils.parseUnits((Math.random() * (Number(maxStake) - Number(minStake)) + Number(minStake)).toString(), decimal);
        await oracle.connect(account).stake(amount);
    }

    // delegate nodes
    for (const account of accounts) {
        await oracle.connect(account).delegateNode(account.address);
    }

    return { token, decimal, oracle, accounts, accountsWithTokens, accountsWithoutTokens, minValidatorStake, consumer };
}

export async function stakingFixture() {
    // deploy token
    const name = 'ConclaveTestToken';
    const ticker = 'tCNCLV';
    const totalSupply = 1_000_000_000;
    const Token = await ethers.getContractFactory('Token');
    const token = await Token.deploy(name, ticker, totalSupply);
    await token.deployed();
    const decimal = await token.decimals();

    // airdrop tokens
    const accounts = await ethers.getSigners();
    const tokenAmount = ethers.utils.parseUnits('100000', decimal);
    const accountsWithTokens = accounts.slice(0, 10);
    const accountsWithoutTokens = accounts.slice(10, 20);

    for (const account of accountsWithTokens) {
        await token.transfer(account.address, tokenAmount);
    }

    // deploy oracle
    const minValidatorStake = ethers.utils.parseUnits('10000', decimal);
    const jobAcceptanceLimitInSeconds = 60; // 1 minute
    const jobFulFillmentLimitInSeconds = 60; // 1 minute per Number
    const slashingAmount = ethers.utils.parseUnits('1000', decimal);
    const minAdaStakingRewards = ethers.utils.parseEther('10');
    const minTokenStakingRewards = ethers.utils.parseUnits('10000', decimal);

    const Oracle = await ethers.getContractFactory('ConclaveOracle');
    const oracle = await Oracle.deploy(
        token.address,
        minValidatorStake,
        jobAcceptanceLimitInSeconds,
        jobFulFillmentLimitInSeconds,
        slashingAmount,
        minAdaStakingRewards,
        minTokenStakingRewards
    );

    const testStakeAmount = ethers.utils.parseUnits('10000', decimal);

    const stake = async (account: SignerWithAddress, amount: BigNumber) => {
        const tx = await oracle.connect(account).stake(amount);
        await tx.wait();
    };
    const approve = async (account: SignerWithAddress) => {
        const tx = await token.connect(account).approve(oracle.address, ethers.constants.MaxUint256);
        await tx.wait();
    };

    const approveAndStake = async (account: SignerWithAddress, amount: BigNumber) => {
        await approve(account);
        await stake(account, amount);
    };

    const unstake = async (account: SignerWithAddress, amount: BigNumber) => {
        const tx = await oracle.connect(account).unstake(amount);
        await tx.wait();
    };

    return {
        token,
        decimal,
        oracle,
        accounts,
        accountsWithTokens,
        accountsWithoutTokens,
        minValidatorStake,
        testStakeAmount,
        stake,
        approve,
        approveAndStake,
        unstake,
    };
}
