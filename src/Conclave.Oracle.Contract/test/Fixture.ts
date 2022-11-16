import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chalk from 'chalk';

export default async function fixture() {
    const {
        token,
        decimal,
        oracle,
        accounts,
        accountsWithTokens,
        accountsWithoutTokens,
        minValidatorStake,
        consumer,
        testStakeAmount,
        stake,
        approve,
        approveAndStake,
        unstake,
        stakeAndDelegate,
        getRandomStakeAmount,
    } = await operatorFixture();

    return {
        token,
        decimal,
        oracle,
        accounts,
        accountsWithTokens,
        accountsWithoutTokens,
        minValidatorStake,
        consumer,
        testStakeAmount,
        stake,
        approve,
        approveAndStake,
        unstake,
        stakeAndDelegate,
        getRandomStakeAmount,
    };
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
    const jobFulFillmentLimitInSeconds = 60; // 1 minute
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
        minAdaStakingRewards,
        minTokenStakingRewards,
        testStakeAmount,
        stake,
        approve,
        approveAndStake,
        unstake,
        jobAcceptanceLimitInSeconds,
        jobFulFillmentLimitInSeconds,
    };
}

export async function delegateNodeFixture() {
    const {
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
        jobAcceptanceLimitInSeconds,
        jobFulFillmentLimitInSeconds,
        minAdaStakingRewards,
        minTokenStakingRewards,
    } = await stakingFixture();

    const stakeAndDelegate = async (operator: SignerWithAddress, node: SignerWithAddress, amount: BigNumber) => {
        await approveAndStake(operator, amount);
        await oracle.connect(operator).delegateNode(node.address);
    };

    const getRandomStakeAmount = (min: number, max: number): BigNumber => {
        const amount = Math.floor(Math.random() * (max - min) + min);
        return ethers.utils.parseUnits(amount.toString(), decimal);
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
        stakeAndDelegate,
        getRandomStakeAmount,
        jobAcceptanceLimitInSeconds,
        jobFulFillmentLimitInSeconds,
        minAdaStakingRewards,
        minTokenStakingRewards,
    };
}

export async function operatorFixture() {
    const {
        oracle,
        accounts,
        token,
        decimal,
        accountsWithTokens,
        accountsWithoutTokens,
        stakeAndDelegate,
        getRandomStakeAmount,
        minValidatorStake,
        testStakeAmount,
        stake,
        approve,
        approveAndStake,
        unstake,
        jobAcceptanceLimitInSeconds,
        jobFulFillmentLimitInSeconds,
        minAdaStakingRewards,
        minTokenStakingRewards,
    } = await delegateNodeFixture();

    // deploy consumer
    const Consumer = await ethers.getContractFactory('OracleConsumer');
    const consumer = await Consumer.deploy(oracle.address, token.address);

    // transfer assets to consumer
    const ethAmount = ethers.utils.parseEther('500');
    const cnclvAmount = ethers.utils.parseUnits('10000000', decimal);

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

    const adaFee = ethers.utils.parseEther('150');
    const adaFeePerNum = ethers.utils.parseEther('0.1');
    const tokenFee = ethers.utils.parseUnits('1000000', decimal);
    const tokenFeePerNum = ethers.utils.parseUnits('100', decimal);
    const minValidator = ethers.BigNumber.from('1');
    const maxValidator = ethers.BigNumber.from('1');
    const numCount = 1;

    const operators = accountsWithTokens;
    const nodes = accountsWithoutTokens;

    // stake and delegate
    let index = 0;
    for (const operator of operators) {
        const formattedMinValidatorStake = ethers.utils.formatUnits(minValidatorStake, decimal);
        const formattedBalance = ethers.utils.formatUnits(await token.balanceOf(operator.address), decimal);
        const randomStakeAmount = getRandomStakeAmount(Number(formattedMinValidatorStake), Number(formattedBalance));
        await stakeAndDelegate(operator, nodes[index], randomStakeAmount);

        index++;
    }

    type Request = {
        numCount: number;
        adaFee: BigNumber;
        adaFeePerNum: BigNumber;
        tokenFee: BigNumber;
        tokenFeePerNum: BigNumber;
        minValidator: BigNumber;
        maxValidator: BigNumber;
    };

    const submitRequest = async (request: Request) => {
        const tx = await consumer.requestRandomNumbers(
            request.numCount,
            request.adaFee,
            request.adaFeePerNum,
            request.tokenFee,
            request.tokenFeePerNum,
            request.minValidator,
            request.maxValidator,
            {
                value: request.adaFee.add(request.adaFeePerNum.mul(request.numCount)),
            }
        );
        const receipt = await ethers.provider.getTransactionReceipt(tx.hash);
        const data = receipt.logs[1].data;
        const topics = receipt.logs[1].topics;
        const jobRequestEvent = new ethers.utils.Interface([
            'event JobRequestCreated(uint256 jobId,uint32 indexed numCount,uint256 indexed timestamp)',
        ]);

        const event = jobRequestEvent.decodeEventLog('JobRequestCreated', data, topics);
        const requestId = event.jobId;
        return requestId;
    };

    const submitResponseAndFinalize = async (requestId: BigNumber, participatingNodes: SignerWithAddress[]) => {
        for (const node of participatingNodes) {
            await oracle.connect(node).acceptJob(requestId);
        }

        let res1 = getResponse(numCount);
        let res2 = getResponse(numCount);

        await ethers.provider.send('evm_increaseTime', [jobAcceptanceLimitInSeconds]);
        for (const node of participatingNodes) {
            await oracle.connect(node).submitResponse(requestId, [res1, res2][Math.round(Math.random())]);
        }

        await ethers.provider.send('evm_increaseTime', [jobAcceptanceLimitInSeconds + jobFulFillmentLimitInSeconds * numCount + 1]);
        await consumer.finalizeResult(requestId);

        const jobDetails = await oracle.getJobDetails(requestId);

        return jobDetails;
    };

    const sampleRequestId = await submitRequest({ numCount, adaFee, adaFeePerNum, tokenFee, tokenFeePerNum, minValidator, maxValidator });

    const getResponse = (count: number) => {
        const res = [];
        for (let i = 0; i < count; i++) {
            res.push(ethers.utils.randomBytes(32));
        }
        return res;
    };

    return {
        token,
        decimal,
        oracle,
        accounts,
        accountsWithTokens,
        accountsWithoutTokens,
        minValidatorStake,
        consumer,
        testStakeAmount,
        stake,
        approve,
        approveAndStake,
        unstake,
        stakeAndDelegate,
        getRandomStakeAmount,
        adaFee,
        adaFeePerNum,
        tokenFee,
        tokenFeePerNum,
        minValidator,
        maxValidator,
        sampleRequestId,
        operators,
        nodes,
        getResponse,
        jobFulFillmentLimitInSeconds,
        jobAcceptanceLimitInSeconds,
        minAdaStakingRewards,
        minTokenStakingRewards,
        submitRequest,
        submitResponseAndFinalize,
    };
}
