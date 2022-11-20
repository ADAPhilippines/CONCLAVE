import chalk from 'chalk';
import { ethers } from 'hardhat';
import config from '../config.json';

async function main() {
    try {
        //@TODO temporary implementation
        const accounts = await ethers.getSigners();
        const oracle = await ethers.getContractAt('ConclaveOracle', config.oracleAddress);
        const consumer = await ethers.getContractAt('OracleConsumer', config.consumerAddress);
        const token = await ethers.getContractAt('Token', config.tokenAddress);
        const decimal = await token.decimals();
        const numCount = 1;
        const baseTokenFee = ethers.utils.parseEther('0.1');
        const baseTokenFeePerNum = ethers.utils.parseEther('0.05');
        const tokenFee = ethers.utils.parseUnits('10', decimal);
        const tokenFeePerNum = ethers.utils.parseUnits('5', decimal);
        const minValidators = 1;
        const maxValidators = 1;
        const totalTokenFee = tokenFee.add(tokenFeePerNum.mul(numCount));
        const totalBaseTokenFee = baseTokenFee.add(baseTokenFeePerNum.mul(numCount));

        console.log("totalBaseTokenFee", totalBaseTokenFee);
        console.log("totalTokenFee", totalTokenFee);
        console.log("accountFeeBalance", await token.balanceOf(accounts[0].address));

        const approveTokenTxReceipt = await token.connect(accounts[0]).approve(consumer.address, totalTokenFee);
        await approveTokenTxReceipt.wait();
        console.log("Account Approve Tx", approveTokenTxReceipt.hash);

        const consumerContractApproveTxReceipt = await consumer.connect(accounts[0]).approve();
        console.log("Consumer Contract Approve Tx", consumerContractApproveTxReceipt.hash);

        const requestRandNumsTxReceipt = await consumer.connect(accounts[0]).requestRandomNumbers(
            numCount,
            baseTokenFee,
            baseTokenFeePerNum,
            tokenFee,
            tokenFeePerNum,
            minValidators,
            maxValidators,
            {
                value: totalBaseTokenFee
            }
        );
        await requestRandNumsTxReceipt.wait();

        const req = await consumer.s_requests(0);
        const acceptJobTxReceipt = await oracle.connect(accounts[0]).acceptJob(req.jobId);
        acceptJobTxReceipt.wait();
        console.log("acceptJobTxReceipt", acceptJobTxReceipt.hash);
        const submitJobTxReceipt = await oracle.connect(accounts[0]).submitResponse(req.jobId, [1337]);
        console.log("submitJobTxReceipt", submitJobTxReceipt.hash);
        await submitJobTxReceipt.wait();
        await delay(numCount * 1000 * 60);
        const finalizeResultTxReceipt = await consumer.finalizeResult(req.jobId);
        await finalizeResultTxReceipt.wait();
        console.log("finalizeResultTxReceipt", finalizeResultTxReceipt.hash);
        const finalizedRequest = await consumer.s_requests(0);
        console.log("Request Data", req.jobId, finalizedRequest);
        const pendingRequest = await oracle.connect(accounts[0]).getTotalPendingRewards();
        console.log("PendingRewards", ethers.utils.formatEther(pendingRequest.baseTokenReward), ethers.utils.formatUnits(pendingRequest.tokenReward, decimal));
        
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

main();
