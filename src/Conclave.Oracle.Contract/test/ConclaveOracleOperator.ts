import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';
import { operatorFixture, delegateNodeFixture, Request } from './Fixture';
import { send } from 'process';

describe('ConclaveOperator Contract', function () {
    describe('DelegateNode function', function () {
        it('Should delegate node', async function () {
            const {
                oracle,
                accountsWithTokens: [operator],
                accountsWithoutTokens: [node],
            } = await loadFixture(delegateNodeFixture);

            await expect(oracle.connect(operator).delegateNode(node.address))
                .to.emit(oracle, 'NodeRegistered')
                .withArgs(node.address, operator.address);
            expect(await oracle.getNode(operator.address)).to.equal(node.address);
            expect(await oracle.getOwner(node.address)).to.equal(operator.address);
        });

        it('Should overwrite delegation if same owner', async function () {
            const {
                oracle,
                accountsWithTokens: [operator],
                accountsWithoutTokens: [node1, node2],
            } = await loadFixture(delegateNodeFixture);

            await oracle.connect(operator).delegateNode(node1.address);
            await oracle.connect(operator).delegateNode(node2.address);
            expect(await oracle.getNode(operator.address)).to.equal(node2.address);
            expect(await oracle.getOwner(node2.address)).to.equal(operator.address);
            expect(await oracle.getOwner(node1.address)).to.equal(ethers.constants.AddressZero);
        });

        it('Should not delegate node if node is registered to a different owner', async function () {
            const {
                oracle,
                accountsWithTokens: [operator1, operator2],
                accountsWithoutTokens: [node],
            } = await loadFixture(delegateNodeFixture);

            await oracle.connect(operator1).delegateNode(node.address);
            await expect(oracle.connect(operator2).delegateNode(node.address))
                .to.be.revertedWithCustomError(oracle, 'NodeRegisteredToAdifferentOperator')
                .withArgs(operator1.address);
        });

        it('Should not delegate if node address is registered to the same owner', async function () {
            const {
                oracle,
                accountsWithTokens: [operator],
                accountsWithoutTokens: [node],
            } = await loadFixture(delegateNodeFixture);

            await oracle.connect(operator).delegateNode(node.address);
            await expect(oracle.connect(operator).delegateNode(node.address)).to.be.revertedWithCustomError(
                oracle,
                'NodeAlreadyRegistered'
            );
        });
    });

    describe('AcceptJob function', function () {
        it('Should accept job', async function () {
            const {
                oracle,
                nodes: [node],
                sampleRequestId,
            } = await loadFixture(operatorFixture);

            await expect(oracle.connect(node).acceptJob(sampleRequestId))
                .to.emit(oracle, 'JobAccepted')
                .to.emit(oracle, 'JobRequestMaxValidatorReached');

            const job = await oracle.getJobDetails(sampleRequestId);
            expect(job.validators.length).to.equal(1);
            expect(job.validators.includes(await oracle.getOwner(node.address))).to.equal(true);
        });

        it('Should not accept job if request does not exist', async function () {
            const {
                oracle,
                nodes: [node],
            } = await loadFixture(operatorFixture);

            await expect(oracle.connect(node).acceptJob(1)).to.be.revertedWithCustomError(oracle, 'RequestNotExist');
        });

        it('Should not be able to accept the same job more than once', async function () {
            const {
                oracle,
                nodes: [node],
                sampleRequestId,
            } = await loadFixture(operatorFixture);

            await oracle.connect(node).acceptJob(sampleRequestId);
            await expect(oracle.connect(node).acceptJob(sampleRequestId)).to.be.revertedWithCustomError(
                oracle,
                'NodeAlreadyRegistered'
            );
        });

        it('Should not be able to accept job if max validators reached', async function () {
            const {
                oracle,
                nodes: [node1, node2],
                sampleRequestId,
                maxValidator,
            } = await loadFixture(operatorFixture);

            await oracle.connect(node1).acceptJob(sampleRequestId);
            await expect(oracle.connect(node2).acceptJob(sampleRequestId))
                .to.be.revertedWithCustomError(oracle, 'MaxValidatorReached')
                .withArgs(maxValidator);
        });

        it('Should not be able to accept job if operator stake below minimum', async function () {
            const {
                oracle,
                nodes: [node],
                operators: [operator],
                sampleRequestId,
            } = await loadFixture(operatorFixture);

            const operatorBalance = await oracle.getStake(operator.address);
            await oracle.connect(operator).unstake(operatorBalance.baseToken, operatorBalance.token);

            await expect(oracle.connect(node).acceptJob(sampleRequestId)).to.be.revertedWithCustomError(
                oracle,
                'NotEnoughStake'
            );
        });

        it('Should not be able to accept job if time limit reached', async function () {
            const {
                oracle,
                nodes: [node],
                sampleRequestId,
            } = await loadFixture(operatorFixture);

            await ethers.provider.send('evm_increaseTime', [61]);
            await expect(oracle.connect(node).acceptJob(sampleRequestId)).to.be.revertedWithCustomError(
                oracle,
                'TimeLimitExceeded'
            );
        });

        it('Should add job id to pending reward ids', async function () {
            const {
                oracle,
                nodes: [node],
                sampleRequestId,
            } = await loadFixture(operatorFixture);

            await oracle.connect(node).acceptJob(sampleRequestId);
            const pendingRewardIds = await oracle.getPendingRewardJobIds(node.address);
            expect(pendingRewardIds.length).to.equal(1);
            expect(pendingRewardIds[0]).to.equal(sampleRequestId);
        });
    });

    describe('SubmitResult function', function () {
        it('Should submit result', async function () {
            const {
                oracle,
                nodes: [node],
                operators: [operator],
                sampleRequestId,
                getResponse,
            } = await loadFixture(operatorFixture);

            await oracle.connect(node).acceptJob(sampleRequestId);
            await ethers.provider.send('evm_increaseTime', [61]);
            const jobDetails = await oracle.getJobDetails(sampleRequestId);
            const response = getResponse(jobDetails.numCount);
            await expect(oracle.connect(node).submitResponse(sampleRequestId, response)).to.emit(
                oracle,
                'ResponseSubmitted'
            );

            const nodeSubmission = await oracle.s_nodeDataId(sampleRequestId, operator.address);
            const dataHash = ethers.utils.keccak256(
                ethers.utils.solidityPack(
                    ['uint256', 'uint256[]', 'uint256', 'address'],
                    [jobDetails.jobId, response, jobDetails.timestamp, jobDetails.requester]
                )
            );
            const dataId = ethers.BigNumber.from(dataHash);

            // should update dataId mapping and incrememnt dataIdVotes by 1
            expect(nodeSubmission).to.equal(dataId);
            expect(await oracle.s_dataIdVotes(sampleRequestId, dataId)).to.equal(1);
        });

        it('Should not be able to submit result twice', async function () {
            const {
                oracle,
                nodes: [node],
                sampleRequestId,
                getResponse,
            } = await loadFixture(operatorFixture);

            await oracle.connect(node).acceptJob(sampleRequestId);
            await ethers.provider.send('evm_increaseTime', [61]);
            const jobDetails = await oracle.getJobDetails(sampleRequestId);
            const response = getResponse(jobDetails.numCount);
            await oracle.connect(node).submitResponse(sampleRequestId, response);
            await expect(oracle.connect(node).submitResponse(sampleRequestId, response)).to.be.revertedWithCustomError(
                oracle,
                'ResponseAlreadySubmitted'
            );
        });

        it('Should not be able to submit result if not registered validator for a job', async function () {
            const {
                oracle,
                nodes: [node],
                sampleRequestId,
                getResponse,
            } = await loadFixture(operatorFixture);

            await expect(
                oracle.connect(node).submitResponse(sampleRequestId, getResponse(1))
            ).to.be.revertedWithCustomError(oracle, 'ResponseSubmissionNotAuthorized');
        });

        it('Should not be able to submit invalid response', async function () {
            const {
                oracle,
                nodes: [node],
                sampleRequestId,
                getResponse,
            } = await loadFixture(operatorFixture);

            await oracle.connect(node).acceptJob(sampleRequestId);
            await ethers.provider.send('evm_increaseTime', [61]);
            await expect(
                oracle.connect(node).submitResponse(sampleRequestId, getResponse(2))
            ).to.be.revertedWithCustomError(oracle, 'InvalidResponse');
        });

        it('Should not be able to submit response if minimum validator not reached', async function () {
            const {
                oracle,
                nodes: [node],
                baseTokenFee,
                baseTokenFeePerNum,
                tokenFee,
                tokenFeePerNum,
                minValidator,
                maxValidator,
                accountsWithTokens: [consumer],
                getResponse,
                submitRequest,
                jobAcceptanceLimitInSeconds,
            } = await loadFixture(operatorFixture);

            const numCount = 2;
            const requestId = await submitRequest(
                {
                    numCount,
                    baseTokenFee,
                    baseTokenFeePerNum,
                    tokenFee,
                    tokenFeePerNum,
                    minValidators: minValidator.add(2),
                    maxValidators: maxValidator.add(3),
                },
                consumer
            );
            const request = await oracle.getJobDetails(requestId);
            await oracle.connect(node).acceptJob(request.jobId);
            await ethers.provider.send('evm_increaseTime', [jobAcceptanceLimitInSeconds + 1]);
            await expect(
                oracle.connect(node).submitResponse(request.jobId, getResponse(numCount))
            ).to.be.revertedWithCustomError(oracle, 'MinValidatorNotReached');
        });

        it('Should not be able to submit response if not within the specified time limit', async function () {
            const {
                oracle,
                nodes: [node],
                sampleRequestId,
                getResponse,
                jobFulFillmentLimitInSeconds,
                jobAcceptanceLimitInSeconds,
            } = await loadFixture(operatorFixture);

            const request = await oracle.getJobDetails(sampleRequestId);
            await oracle.connect(node).acceptJob(sampleRequestId);
            const timeJump = jobAcceptanceLimitInSeconds + jobFulFillmentLimitInSeconds * request.numCount + 100000;
            await ethers.provider.send('evm_increaseTime', [timeJump]);
            await expect(
                oracle.connect(node).submitResponse(sampleRequestId, getResponse(request.numCount))
            ).to.be.revertedWithCustomError(oracle, 'TimeLimitExceeded');
        });

        it('Should not be able to submit if request does not exist', async function () {
            const {
                oracle,
                nodes: [node],
                getResponse,
            } = await loadFixture(operatorFixture);

            await expect(oracle.connect(node).submitResponse(1, getResponse(1))).to.be.revertedWithCustomError(
                oracle,
                'RequestNotExist'
            );
        });

        it('Should be able to trigger distribute staking reward function and distribute rewards', async function () {
            const {
                oracle,
                nodes,
                operators,
                operators: [operator1],
                accountsWithTokens: [consumer],
                submitRequest,
                submitResponseAndFinalize,
                unstake,
                decimal,
            } = await loadFixture(operatorFixture);

            const baseTokenFee = ethers.utils.parseEther('150');
            const baseTokenPerNum = ethers.utils.parseEther('10');
            const tokenFee = ethers.utils.parseUnits('100000', decimal);
            const tokenPerNum = ethers.utils.parseUnits('100', decimal);

            for (const operator of operators) {
                if (operator.address === operator1.address) continue;
                const balance = await oracle.getStake(operator.address);
                await unstake(operator, balance.baseToken, balance.token);
            }

            const request: Request = {
                numCount: 2,
                baseTokenFee,
                baseTokenFeePerNum: baseTokenPerNum,
                tokenFee,
                tokenFeePerNum: tokenPerNum,
                minValidators: BigNumber.from(1),
                maxValidators: BigNumber.from(2),
            };

            const requestId = await submitRequest(request, consumer);

            await ethers.provider.send('evm_increaseTime', [60]);
            await submitResponseAndFinalize(requestId, [nodes[0]], consumer);

            const newRequestId = await submitRequest(request, consumer);
            await submitResponseAndFinalize(newRequestId, [nodes[0]], consumer);

            const stakingRewards = await oracle.s_totalStakingRewards(operator1.address);
            const operatorStakingRewards = await oracle.s_totalStakingRewards(operator1.address);

            expect(stakingRewards.baseToken).to.be.equal(operatorStakingRewards.baseToken);
            expect(stakingRewards.token).to.be.equal(operatorStakingRewards.token);
            expect(await oracle.s_latestDistributorNode()).to.equal(nodes[0].address);
        });
    });

    describe('GetPendingRewards function', async function () {
        it('Should display all pending reward from accepted jobs', async function () {
            const {
                oracle,
                nodes: [node1, node2, node3, node4, node5],
                simulateJobCycle,
                calculateWeight,
                calculateShare,
            } = await loadFixture(operatorFixture);

            const participatingNodes = [node1, node2, node3, node4, node5];
            const requestIds = await simulateJobCycle(5, participatingNodes, 2, 5);

            for (const node of participatingNodes) {
                for (let i = 0; i < requestIds.length; i++) {
                    const {
                        jobId,
                        finalResultDataId,
                        baseBaseTokenFee,
                        baseTokenFeePerNum,
                        baseTokenFee,
                        tokenFeePerNum,
                        numCount,
                    } = await oracle.getJobDetails(requestIds[i]);

                    const reward = await oracle.connect(node).getPendingRewardsByJobId(jobId);
                    const opeartorAddr = await oracle.getOwner(node.address);
                    const nodeDataId = await oracle.connect(node).s_nodeDataId(jobId, opeartorAddr);

                    if (finalResultDataId.eq(nodeDataId)) {
                        const totalResponses = await oracle.s_dataIdVotes(jobId, finalResultDataId);
                        const weight = calculateWeight(BigNumber.from(1), BigNumber.from(totalResponses));

                        const totalbaseTokenRewards = calculateShare(
                            BigNumber.from(90).mul(100),
                            baseBaseTokenFee.add(baseTokenFeePerNum.mul(numCount))
                        );
                        const totalTokenRewards = calculateShare(
                            BigNumber.from(90).mul(100),
                            baseTokenFee.add(tokenFeePerNum.mul(numCount))
                        );
                        const baseTokenShare = calculateShare(weight, totalbaseTokenRewards);
                        const tokenShare = calculateShare(weight, totalTokenRewards);

                        expect(reward.baseToken).to.be.equal(baseTokenShare);
                        expect(reward.token).to.be.equal(tokenShare);
                    } else {
                        expect(reward.baseToken).to.be.equal(0);
                        expect(reward.token).to.be.equal(0);
                    }
                }
            }
        });
    });

    describe('ClaimPendingRewards function', function () {
        it('Should add pending rewards to stake balance', async function () {
            const { oracle, nodes, simulateJobCycle } = await loadFixture(operatorFixture);
            const requestCount = 3;
            const requestIds = await simulateJobCycle(requestCount, nodes, 3, 10);

            for (const node of nodes) {
                const balance = await oracle.getStake(await oracle.getOwner(node.address));
                const pendingRewards = await oracle.connect(node).getTotalPendingRewards();
                await oracle.connect(node).claimPendingRewards();
                const newBalance = await oracle.getStake(await oracle.getOwner(node.address));
                const totalDeductions = await oracle.s_totalDeductedStakes(await oracle.getOwner(node.address));

                expect(newBalance.baseToken).to.be.equal(
                    balance.baseToken.add(pendingRewards.baseTokenReward).sub(totalDeductions.baseToken)
                );
                expect(newBalance.token).to.be.equal(
                    balance.token.add(pendingRewards.tokenReward).sub(totalDeductions.token)
                );
            }
        });

        it('Should revert when no pending rewards', async function () {
            const { oracle, nodes, simulateJobCycleNotFinalized } = await loadFixture(operatorFixture);

            await simulateJobCycleNotFinalized(3, nodes, 3, 10);

            await expect(oracle.connect(nodes[0]).claimPendingRewards()).to.be.revertedWithCustomError(
                oracle,
                'NoPendingRewards'
            );
        });

        it('Should send node allowance upon claiming reward', async function () {
            const { oracle, nodes, operators, simulateJobCycle, calculateShare } = await loadFixture(operatorFixture);
            const requestCount = 3;
            const requestIds = await simulateJobCycle(requestCount, nodes, 3, 10);

            await oracle.connect(operators[0]).setNodeAllowance(10);
            const opeartorBalance = await operators[0].getBalance();
            const pendingRewards = await oracle.connect(nodes[0]).getTotalPendingRewards();
            const nodeBalanceBefore = await nodes[0].getBalance();
            const contractBalanceBefore = await oracle.balance();

            const tx = await oracle.connect(nodes[0]).claimPendingRewards();
            const receipt = await tx.wait();
            const allowancePercentage = await oracle.s_nodeAllowances(operators[0].address);

            const allowance = calculateShare(
                BigNumber.from(allowancePercentage).mul(100),
                pendingRewards.baseTokenReward
            );
            const nodeBalanceAfter = await nodes[0].getBalance();
            const operatorBalanceAfter = await operators[0].getBalance();
            const contractBalanceAfter = await oracle.balance();
            const gasUsed = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);

            expect(contractBalanceAfter.baseToken).to.equal(contractBalanceBefore.baseToken.sub(allowance));
            expect(nodeBalanceAfter).to.be.equal(nodeBalanceBefore.add(allowance).sub(gasUsed));
            expect(operatorBalanceAfter).to.equal(opeartorBalance);
        });
    });
});
