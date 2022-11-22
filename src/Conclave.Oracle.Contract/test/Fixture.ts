import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

export default async function fixture() {
    const {
        token,
        decimal,
        oracle,
        accounts,
        accountsWithTokens,
        accountsWithoutTokens,
        minbaseTokenStake,
        minTokenStake,
        testAdaStake,
        testTokenStake,
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
        minbaseTokenStake,
        minTokenStake,
        testAdaStake,
        testTokenStake,
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
    const minTokenStake = ethers.utils.parseUnits('10000', decimal);
    const minbaseTokenStake = ethers.utils.parseEther('50');
    const jobAcceptanceLimitInSeconds = 60; // 1 minute
    const jobFulFillmentLimitInSeconds = 60; // 1 minute
    const minbaseTokenStakingRewards = ethers.utils.parseEther('10');
    const minTokenStakingRewards = ethers.utils.parseUnits('10000', decimal);

    const Oracle = await ethers.getContractFactory('ConclaveOracle');
    const oracle = await Oracle.deploy(
        token.address,
        minbaseTokenStake,
        minTokenStake,
        minbaseTokenStakingRewards,
        minTokenStakingRewards,
        jobAcceptanceLimitInSeconds,
        jobFulFillmentLimitInSeconds
    );

    const testBaseTokenStake = ethers.utils.parseEther('50');
    const testTokenStake = ethers.utils.parseUnits('100000', decimal);

    const stake = async (account: SignerWithAddress, baseToken: BigNumber, token: BigNumber) => {
        const tx = await oracle.connect(account).stake(baseToken, token, { value: baseToken });
        await tx.wait();
    };
    const approve = async (account: SignerWithAddress) => {
        const tx = await token.connect(account).approve(oracle.address, ethers.constants.MaxUint256);
        await tx.wait();
    };

    const approveAndStake = async (account: SignerWithAddress, baseToken: BigNumber, token: BigNumber) => {
        await approve(account);
        await stake(account, baseToken, token);
    };

    const unstake = async (account: SignerWithAddress, baseToken: BigNumber, token: BigNumber) => {
        const tx = await oracle.connect(account).unstake(baseToken, token);
        await tx.wait();
    };

    return {
        token,
        decimal,
        oracle,
        accounts,
        accountsWithTokens,
        accountsWithoutTokens,
        minbaseTokenStake,
        minTokenStake,
        minbaseTokenStakingRewards,
        minTokenStakingRewards,
        testBaseTokenStake,
        testTokenStake,
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
        minbaseTokenStake,
        minTokenStake,
        testBaseTokenStake,
        testTokenStake,
        stake,
        approve,
        approveAndStake,
        unstake,
        jobAcceptanceLimitInSeconds,
        jobFulFillmentLimitInSeconds,
        minbaseTokenStakingRewards,
        minTokenStakingRewards,
    } = await stakingFixture();

    const stakeAndDelegate = async (
        operator: SignerWithAddress,
        node: SignerWithAddress,
        baseToken: BigNumber,
        token: BigNumber
    ) => {
        await approveAndStake(operator, baseToken, token);
        await oracle.connect(operator).delegateNode(node.address);
    };

    const getRandomStakeAmount = (min: number, max: number): BigNumber => {
        max = Math.min(max, 100000);
        const amount = Math.floor(Math.random() * (max - min) + min);
        return ethers.utils.parseUnits(amount.toString(), decimal);
    };

    const calculateShare = (share: BigNumber, total: BigNumber): BigNumber => {
        return share.mul(total).div(ethers.BigNumber.from('10000'));
    };

    const calculateWeight = (amount: BigNumber, total: BigNumber): BigNumber => {
        return amount.mul(ethers.BigNumber.from('10000')).div(total);
    };

    return {
        token,
        decimal,
        oracle,
        accounts,
        accountsWithTokens,
        accountsWithoutTokens,
        minbaseTokenStake,
        minTokenStake,
        testBaseTokenStake,
        testTokenStake,
        stake,
        approve,
        approveAndStake,
        unstake,
        stakeAndDelegate,
        getRandomStakeAmount,
        calculateShare,
        calculateWeight,
        jobAcceptanceLimitInSeconds,
        jobFulFillmentLimitInSeconds,
        minbaseTokenStakingRewards,
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
        minbaseTokenStake,
        minTokenStake,
        testBaseTokenStake,
        testTokenStake,
        stake,
        approve,
        approveAndStake,
        unstake,
        calculateShare,
        calculateWeight,
        jobAcceptanceLimitInSeconds,
        jobFulFillmentLimitInSeconds,
        minbaseTokenStakingRewards,
        minTokenStakingRewards,
    } = await delegateNodeFixture();

    // approvals
    for (const account of accountsWithTokens) {
        await token.connect(account).approve(oracle.address, ethers.constants.MaxUint256);
    }

    const baseTokenFee = ethers.utils.parseEther('1');
    const baseTokenFeePerNum = ethers.utils.parseEther('0.1');
    const tokenFee = ethers.utils.parseUnits('1000', decimal);
    const tokenFeePerNum = ethers.utils.parseUnits('100', decimal);
    const minValidators = ethers.BigNumber.from('1');
    const maxValidators = ethers.BigNumber.from('1');
    const numCount = 1;

    const operators = accountsWithTokens;
    const nodes = accountsWithoutTokens;

    // stake and delegate
    let index = 0;
    for (const operator of operators) {
        const formattedMinbaseTokenStake = ethers.utils.formatEther(minbaseTokenStake);
        const formattedMinTokenStake = ethers.utils.formatUnits(minTokenStake, decimal);
        const formattedTokenBalance = ethers.utils.formatUnits(await token.balanceOf(operator.address), decimal);
        const formattedbaseTokenBalance = await operator.getBalance();
        const randomTokenAmount = getRandomStakeAmount(Number(formattedMinTokenStake), Number(formattedTokenBalance));
        await stakeAndDelegate(operator, nodes[index], minbaseTokenStake, randomTokenAmount);

        index++;
    }

    const submitRequest = async (request: Request, consumer: SignerWithAddress) => {
        const tx = await oracle
            .connect(consumer)
            .requestRandomNumbers(
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

    const submitResponses = async (requestId: BigNumber, participatingNodes: SignerWithAddress[]) => {
        for (const node of participatingNodes) {
            await oracle.connect(node).acceptJob(requestId);
        }

        const { numCount } = await oracle.getJobDetails(requestId);

        let res1 = getResponse(numCount);
        let res2 = getResponse(numCount);

        await ethers.provider.send('evm_increaseTime', [jobAcceptanceLimitInSeconds]);
        for (const node of participatingNodes) {
            await oracle.connect(node).submitResponse(requestId, [res1, res2][Math.round(Math.random())]);
        }

        await ethers.provider.send('evm_increaseTime', [
            jobAcceptanceLimitInSeconds + jobFulFillmentLimitInSeconds * numCount + 1,
        ]);
    };

    const submitResponseAndFinalize = async (
        requestId: BigNumber,
        participatingNodes: SignerWithAddress[],
        consumer: SignerWithAddress
    ) => {
        await submitResponses(requestId, participatingNodes);
        await oracle.connect(consumer).aggregateResult(requestId);

        const jobDetails = await oracle.getJobDetails(requestId);

        return jobDetails;
    };

    const sampleRequestId = await submitRequest(
        {
            numCount,
            adaFee,
            adaFeePerNum,
            tokenFee,
            tokenFeePerNum,
            minValidator,
            maxValidator,
        },
        accountsWithTokens[0]
    );

    const getResponse = (count: number) => {
        const res = [];
        for (let i = 0; i < count; i++) {
            res.push(ethers.utils.randomBytes(32));
        }
        return res;
    };

    const simulateJobCycle = async (
        requestCount: number,
        participatingNodes: SignerWithAddress[],
        minValidator: number,
        maxValidator: number
    ): Promise<BigNumber[]> => {
        const requestIds: BigNumber[] = [];

        for (let i = 0; i < requestCount; i++) {
            let numCount = Math.floor(Math.random() * 5) + 1;
            const requestId = await submitRequest(
                {
                    numCount,
                    adaFee,
                    adaFeePerNum,
                    tokenFee,
                    tokenFeePerNum,
                    minValidator: ethers.BigNumber.from(minValidator),
                    maxValidator: ethers.BigNumber.from(maxValidator),
                },
                accounts[0]
            );

            await submitResponseAndFinalize(requestId, participatingNodes, accounts[0]);

            requestIds.push(requestId);
        }

        return requestIds;
    };

    const simulateJobCycleNotFinalized = async (
        requestCount: number,
        participatingNodes: SignerWithAddress[],
        minValidator: number,
        maxValidator: number
    ): Promise<BigNumber[]> => {
        const requestIds: BigNumber[] = [];

        for (let i = 0; i < requestCount; i++) {
            let numCount = Math.floor(Math.random() * 5) + 1;
            const requestId = await submitRequest(
                {
                    numCount,
                    adaFee,
                    adaFeePerNum,
                    tokenFee,
                    tokenFeePerNum,
                    minValidator: ethers.BigNumber.from(minValidator),
                    maxValidator: ethers.BigNumber.from(maxValidator),
                },
                accounts[0]
            );

            await submitResponses(requestId, participatingNodes);

            requestIds.push(requestId);
        }

        return requestIds;
    };

    return {
        token,
        decimal,
        oracle,
        accounts,
        accountsWithTokens,
        accountsWithoutTokens,
        minbaseTokenStake,
        minTokenStake,
        testAdaStake,
        testTokenStake,
        stake,
        approve,
        approveAndStake,
        unstake,
        stakeAndDelegate,
        getRandomStakeAmount,
        baseTokenFee,
        baseTokenFeePerNum,
        tokenFee,
        tokenFeePerNum,
        minValidator: minValidators,
        maxValidator: maxValidators,
        sampleRequestId,
        operators,
        nodes,
        getResponse,
        jobFulFillmentLimitInSeconds,
        jobAcceptanceLimitInSeconds,
        minbaseTokenStakingRewards,
        minTokenStakingRewards,
        submitRequest,
        submitResponseAndFinalize,
        simulateJobCycle,
        submitResponses,
        simulateJobCycleNotFinalized,
        calculateShare,
        calculateWeight,
    };
}

export type Request = {
    numCount: number;
    baseTokenFee: BigNumber;
    baseTokenFeePerNum: BigNumber;
    tokenFee: BigNumber;
    tokenFeePerNum: BigNumber;
    minValidators: BigNumber;
    maxValidators: BigNumber;
};
