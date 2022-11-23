import chalk from 'chalk';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import config from '../config.json';

async function main() {
    try {
        const accounts = (await ethers.getSigners()).splice(0, 10);
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
                    const maxValidators = random(3, 9);
                    const totalTokenFee = tokenFee.add(tokenFeePerNum.mul(numCount));
                    const totalBaseTokenFee = baseTokenFee.add(baseTokenFeePerNum.mul(numCount));
                    const approveTokenTxReceipt = await token.connect(accounts[0]).approve(consumer.address, totalTokenFee);
                    await approveTokenTxReceipt.wait();

                    await consumer.connect(accounts[0]).approve();

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
                            // Check for Available Jobs
                            const jobIds = await oracle.getPendingJobIds();
                            if (jobIds.length <= 0) {
                                await delay(100);
                                continue;
                            };

                            const jobs: Promise<void>[] = [];
                            // Accept the most recent job as fast as possible
                            jobIds.forEach((jobId) => {
                                jobs.push(new Promise(async (resolve) => {
                                    try {
                                        const acceptJobTxReceipt = await oracle.connect(acc).acceptJob(jobId);
                                        acceptJobTxReceipt.wait();

                                        // Wait Job to be ready, once ready submit results
                                        while (!await oracle.isJobReady(jobId)) {
                                            await delay(100);
                                        }

                                        const jobDetails = await oracle.getJobDetails(jobId);
                                        const seed = jobDetails.seed;
                                        const submitJobTxReceipt = await oracle.connect(acc).submitResponse(jobId, getJobResult(jobDetails.numCount, seed));
                                        await submitJobTxReceipt.wait();

                                        // @TODO: don't finalize yet, keep checking for job status
                                        const finalizeResultTxReceipt = await consumer.finalizeResult(jobId);
                                        await finalizeResultTxReceipt.wait();
                                        await oracle.connect(acc).claimPendingRewards();
                                    } catch { try { await consumer.finalizeResult(jobId); } catch { } }
                                    resolve();
                                }));
                            });
                            await Promise.all(jobs);
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

        (async () => {
            while (true) {
                const jobIds = await oracle.getPendingJobIds();
                const oracleBalance = await oracle.balance();
                const stakingRewards = await oracle.s_totalPendingStakingRewards();
                console.clear();
                console.log(chalk.cyan("== Conclave Oracle Node Job Request/Submit Simulator 🧨🚀🎊 ==\n"));
                console.log(
                    chalk.green('Oracle Pending Jobs: '),
                    chalk.blue(jobIds.length),
                    // chalk.green('\nOracle Pending JobIds: '),
                    // jobIds,
                );
                console.log(
                    chalk.green('Oracle Balance:'),
                    chalk.yellow('\n  [BaseToken]'),
                    chalk.blue(ethers.utils.formatEther(oracleBalance.baseToken)),
                    chalk.yellow('\n  [Token]'),
                    chalk.blue(ethers.utils.formatUnits(oracleBalance.token, decimal)),
                    chalk.yellow('\n  [Pending Staking Base Token Rewards]'),
                    chalk.blue(ethers.utils.formatEther(stakingRewards.baseToken)),
                    chalk.yellow('\n  [Pending Staking Token Rewards]'),
                    chalk.blue(ethers.utils.formatUnits(stakingRewards.token, decimal))
                );

                console.log(chalk.cyan("\n== Account Oracle Balances =="));
                for (const i in accounts) {
                    const address = accounts[i].address;
                    const stake = await oracle.getStake(address);
                    const baseTokenBalance = await accounts[i].getBalance();
                    console.log(
                        chalk.green(`Account Balance [${chalk.blue(address)}]:`),
                        chalk.yellow('\n  [BaseToken]'),
                        chalk.blue(ethers.utils.formatEther(stake.baseToken)),
                        chalk.yellow('\n  [Token]'),
                        chalk.blue(ethers.utils.formatUnits(stake.token, decimal)),
                        chalk.yellow('\n  [Wallet Balance]'),
                        chalk.blue(ethers.utils.formatEther(baseTokenBalance))
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
