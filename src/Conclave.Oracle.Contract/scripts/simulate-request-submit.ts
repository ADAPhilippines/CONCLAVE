import chalk from 'chalk';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import config from '../config.json';

async function main() {
    try {
        //@TODO temporary implementation
        const accounts = (await ethers.getSigners()).splice(10);
        const oracle = await ethers.getContractAt('ConclaveOracle', config.oracleAddress);
        const consumer = await ethers.getContractAt('OracleConsumer', config.consumerAddress);
        const token = await ethers.getContractAt('Token', config.tokenAddress);
        const decimal = await token.decimals();


        const requestRandomNumbers = () => {
            return new Promise(async (resolve) => {
                try {
                    const baseTokenFee = ethers.utils.parseEther('0.1');
                    const baseTokenFeePerNum = ethers.utils.parseEther('0.05');
                    const tokenFee = ethers.utils.parseUnits('10', decimal);
                    const tokenFeePerNum = ethers.utils.parseUnits('5', decimal);
                    const numCount = random(1, 10);
                    const minValidators = random(1, 3);
                    const maxValidators = random(3, 5);
                    const totalTokenFee = tokenFee.add(tokenFeePerNum.mul(numCount));
                    const totalBaseTokenFee = baseTokenFee.add(baseTokenFeePerNum.mul(numCount));
                    const approveTokenTxReceipt = await token.connect(accounts[0]).approve(consumer.address, totalTokenFee);
                    await approveTokenTxReceipt.wait();

                    const consumerContractApproveTxReceipt = await consumer.connect(accounts[0]).approve();

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
                } catch {
                }
                await delay(random(100, 1000 * 1));
                await requestRandomNumbers()
                resolve(null);
            });
        }
        requestRandomNumbers();

        const processRequests = () => {
            return new Promise(async (resolve) => {
                accounts.forEach(async (acc, i) => {
                    while (true) {
                        try {
                            // Ignore Account Zero
                            if (i <= 0) return;
                            // Check for Available Jobs
                            const jobIds = await oracle.getPendingJobIds();
                            if (jobIds.length <= 0) {
                                await delay(100);
                                continue;
                            };

                            // Accept the most recent job as fast as possible
                            const jobId = jobIds[jobIds.length - 1];
                            const acceptJobTxReceipt = await oracle.connect(acc).acceptJob(jobId);
                            acceptJobTxReceipt.wait();

                            // Wait Job to be ready, once ready submit results
                            while (!await oracle.isJobReady(jobId)) { }
                            const jobDetails = await oracle.getJobDetails(jobId);
                            const seed = jobDetails.seed;
                            const submitJobTxReceipt = await oracle.connect(acc).submitResponse(jobId, getJobResult(jobDetails.numCount, seed));
                            await submitJobTxReceipt.wait();

                            // @TODO: don't finalize yet, keep checking for job status
                            const finalizeResultTxReceipt = await consumer.finalizeResult(jobId);
                            await finalizeResultTxReceipt.wait();
                            await oracle.connect(acc).claimPendingRewards();
                            await delay(random(100, 1000 * 1));
                        } catch {
                            await delay(100);
                            continue;
                        }
                    }
                });
                resolve(null);
            });
        };
        processRequests();

        const logger = (async () => {
            while (true) {
                const jobIds = await oracle.getPendingJobIds();
                const oracleBalance = await oracle.balance();
                console.clear();
                console.log(chalk.cyan("== Conclave Oracle Node Job Request/Submit Simulator 🧨🚀🎊 ==\n"));
                console.log(
                    chalk.green('Oracle Pending Jobs: '),
                    chalk.blue(jobIds.length)
                );
                console.log(
                    chalk.green('Oracle Balance:'),
                    chalk.yellow('\n  [BaseToken]'),
                    chalk.blue(ethers.utils.formatEther(oracleBalance.baseToken)),
                    chalk.yellow('\n  [Token]'),
                    chalk.blue(ethers.utils.formatUnits(oracleBalance.token, decimal))
                );

                console.log(chalk.cyan("\n== Account Oracle Balances =="));
                for (const i in accounts) {
                    const address = accounts[i].address;
                    const stake = await oracle.getStake(address);
                    console.log(
                        chalk.green(`Account Balance [${chalk.blue(address)}]:`),
                        chalk.yellow('\n  [BaseToken]'),
                        chalk.blue(ethers.utils.formatEther(stake.baseToken)),
                        chalk.yellow('\n  [Token]'),
                        chalk.blue(ethers.utils.formatUnits(stake.token, decimal))
                    );
                }
                await delay(1000);
            }
        })();

    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function random(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function getJobResult(numCount: number, seed: BigNumber) {
    const result: number[] = [];
    for (let i = 0; i < numCount; i++) {
        // Shake it up 😂
        if (seed.mod(2).toNumber() == 0)
            result.push(1337);
        else
            result.push(7331)
    }
    return result;
}


main();
