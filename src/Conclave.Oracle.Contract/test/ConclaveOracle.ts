import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';
import { operatorFixture, delegateNodeFixture, Request } from './Fixture';

describe('ConclaveOracle contract', function () {
    describe('RequestRandomNumbers function', function () {
        it('Should accept valid requests', async function () {
            const {
                oracle,
                accountsWithTokens: [consumer],
                submitRequest,
                decimal,
            } = await loadFixture(operatorFixture);

            const request: Request = {
                numCount: 2,
                adaFee: ethers.utils.parseEther('1'),
                tokenFee: ethers.utils.parseUnits('100', decimal),
                adaFeePerNum: ethers.utils.parseEther('0.5'),
                tokenFeePerNum: ethers.utils.parseUnits('50', decimal),
                minValidator: BigNumber.from(3),
                maxValidator: BigNumber.from(5),
            };

            const requestId = await submitRequest(request, consumer);
            const requestInfo = await oracle.getJobDetails(requestId);

            expect(requestInfo.status).to.equal(0);
            expect(requestInfo.requester).to.equal(consumer.address);
        });

        it('Should emit JobRequestCreated event', async function () {
            const { oracle, submitRequest, decimal } = await loadFixture(operatorFixture);

            const request: Request = {
                numCount: 2,
                adaFee: ethers.utils.parseEther('1'),
                tokenFee: ethers.utils.parseUnits('100', decimal),
                adaFeePerNum: ethers.utils.parseEther('0.5'),
                tokenFeePerNum: ethers.utils.parseUnits('50', decimal),
                minValidator: BigNumber.from(3),
                maxValidator: BigNumber.from(5),
            };

            const totalAdaFee = request.adaFee.add(request.adaFeePerNum.mul(request.numCount));

            await expect(
                oracle.requestRandomNumbers(
                    request.numCount,
                    request.adaFee,
                    request.adaFeePerNum,
                    request.tokenFee,
                    request.tokenFeePerNum,
                    request.minValidator,
                    request.maxValidator,
                    { value: totalAdaFee }
                )
            ).to.emit(oracle, 'JobRequestCreated');
        });

        it('Should not accept request if not within mininimum and maximum allowed number count', async function () {
            const {
                oracle,
                submitRequest,
                decimal,
                accountsWithTokens: [consumer],
            } = await loadFixture(operatorFixture);

            const notWithinMinRequest: Request = {
                numCount: 0,
                adaFee: ethers.utils.parseEther('1'),
                tokenFee: ethers.utils.parseUnits('100', decimal),
                adaFeePerNum: ethers.utils.parseEther('0.5'),
                tokenFeePerNum: ethers.utils.parseUnits('50', decimal),
                minValidator: BigNumber.from(3),
                maxValidator: BigNumber.from(5),
            };

            const notWithinMaxRequest: Request = {
                numCount: 501,
                adaFee: ethers.utils.parseEther('1'),
                tokenFee: ethers.utils.parseUnits('100', decimal),
                adaFeePerNum: ethers.utils.parseEther('0.5'),
                tokenFeePerNum: ethers.utils.parseUnits('50', decimal),
                minValidator: BigNumber.from(3),
                maxValidator: BigNumber.from(5),
            };

            await expect(submitRequest(notWithinMinRequest, consumer)).to.be.revertedWithCustomError(
                oracle,
                'NumberCountNotInRange'
            );
            await expect(submitRequest(notWithinMaxRequest, consumer)).to.be.revertedWithCustomError(
                oracle,
                'NumberCountNotInRange'
            );
        });

        it('Should not accept invalid validator range', async function () {
            const {
                oracle,
                submitRequest,
                decimal,
                accountsWithTokens: [consumer],
            } = await loadFixture(operatorFixture);

            const request: Request = {
                numCount: 2,
                adaFee: ethers.utils.parseEther('1'),
                tokenFee: ethers.utils.parseUnits('100', decimal),
                adaFeePerNum: ethers.utils.parseEther('0.5'),
                tokenFeePerNum: ethers.utils.parseUnits('50', decimal),
                minValidator: BigNumber.from(6),
                maxValidator: BigNumber.from(2),
            };

            await expect(submitRequest(request, consumer)).to.be.revertedWithCustomError(
                oracle,
                'InvalidValidatorRange'
            );
        });

        it('Should not accept if fees sent do the match the amount specified', async function () {
            const {
                oracle,
                accountsWithTokens: [consumer],
                decimal,
                token,
            } = await loadFixture(operatorFixture);

            const request: Request = {
                numCount: 2,
                adaFee: ethers.utils.parseEther('1'),
                tokenFee: ethers.utils.parseUnits('100', decimal),
                adaFeePerNum: ethers.utils.parseEther('0.5'),
                tokenFeePerNum: ethers.utils.parseUnits('50', decimal),
                minValidator: BigNumber.from(5),
                maxValidator: BigNumber.from(10),
            };

            const totalFee = request.adaFee.add(request.adaFeePerNum.mul(request.numCount));

            await expect(
                oracle
                    .connect(consumer)
                    .requestRandomNumbers(
                        request.numCount,
                        request.adaFee,
                        request.adaFeePerNum,
                        request.tokenFee,
                        request.tokenFeePerNum,
                        request.minValidator,
                        request.maxValidator,
                        { value: totalFee.sub(10) }
                    )
            ).to.be.revertedWithCustomError(oracle, 'ValueMismatch');

            const balance = await token.balanceOf(consumer.address);
            request.tokenFee = balance.add(100);

            await expect(
                oracle
                    .connect(consumer)
                    .requestRandomNumbers(
                        request.numCount,
                        request.adaFee,
                        request.adaFeePerNum,
                        request.tokenFee,
                        request.tokenFeePerNum,
                        request.minValidator,
                        request.maxValidator,
                        { value: totalFee }
                    )
            ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
        });

        it('Should add the fees to the contract balances', async function () {
            const {
                oracle,
                submitRequest,
                decimal,
                accountsWithTokens: [consumer],
            } = await loadFixture(operatorFixture);

            const request: Request = {
                numCount: 2,
                adaFee: ethers.utils.parseEther('1'),
                tokenFee: ethers.utils.parseUnits('100', decimal),
                adaFeePerNum: ethers.utils.parseEther('0.5'),
                tokenFeePerNum: ethers.utils.parseUnits('50', decimal),
                minValidator: BigNumber.from(5),
                maxValidator: BigNumber.from(10),
            };

            const totalAdaFee = request.adaFee.add(request.adaFeePerNum.mul(request.numCount));
            const totalTokenFee = request.tokenFee.add(request.tokenFeePerNum.mul(request.numCount));

            const balanceBefore = await oracle.balance();
            await submitRequest(request, consumer);
            const balanceAfter = await oracle.balance();
            expect(balanceAfter.baseToken).to.equal(balanceBefore.baseToken.add(totalAdaFee));
            expect(balanceAfter.token).to.equal(balanceBefore.token.add(totalTokenFee));
        });

        it('Should tag request properly', async function () {
            const {
                oracle,
                accountsWithTokens: [consumer],
                simulateJobCycle,
                submitRequest,
                nodes,
                decimal,
            } = await loadFixture(operatorFixture);

            const requestIds = await simulateJobCycle(10, nodes, 5, 10);

            for (const requestId of requestIds) {
                const requestInfo = await oracle.getJobDetails(requestId);
                expect(requestInfo.status).to.equal(2);
            }

            const request: Request = {
                numCount: 2,
                adaFee: ethers.utils.parseEther('1'),
                tokenFee: ethers.utils.parseUnits('100', decimal),
                adaFeePerNum: ethers.utils.parseEther('0.5'),
                tokenFeePerNum: ethers.utils.parseUnits('50', decimal),
                minValidator: BigNumber.from(3),
                maxValidator: BigNumber.from(5),
            };

            const requestId = await submitRequest(request, consumer);
            const requestInfo = await oracle.getJobDetails(requestId);
            expect(requestInfo.status).to.equal(0);
            await ethers.provider.send('evm_increaseTime', [86400]);
            await oracle.connect(consumer).aggregateResult(requestId);

            const updatedDequestInfo = await oracle.getJobDetails(requestId);
            expect(updatedDequestInfo.status).to.equal(1);
        });
    });

    describe('AggregateResult function', function () {
        it('Should deduct the fees to contract balance in case of a refund', async function () {
            const {
                oracle,
                submitRequest,
                decimal,
                accountsWithTokens: [consumer],
            } = await loadFixture(operatorFixture);

            const request: Request = {
                numCount: 2,
                adaFee: ethers.utils.parseEther('1'),
                tokenFee: ethers.utils.parseUnits('100', decimal),
                adaFeePerNum: ethers.utils.parseEther('0.5'),
                tokenFeePerNum: ethers.utils.parseUnits('50', decimal),
                minValidator: BigNumber.from(5),
                maxValidator: BigNumber.from(10),
            };

            const balanceBefore = await oracle.balance();
            const requestId = await submitRequest(request, consumer);

            await ethers.provider.send('evm_increaseTime', [86400]);
            await oracle.connect(consumer).aggregateResult(requestId);

            const balanceAfter = await oracle.balance();

            const requestInfo = await oracle.getJobDetails(requestId);

            expect(balanceBefore.baseToken).to.equal(balanceAfter.baseToken);
            expect(balanceBefore.token).to.equal(balanceAfter.token);
            expect(requestInfo.status).to.equal(1);
        });

        it('Should choose the highest votes when aggregating', async function () {
            const { oracle, simulateJobCycle, nodes } = await loadFixture(operatorFixture);

            const requestIds = await simulateJobCycle(10, nodes, 5, 10);

            for (const requestId of requestIds) {
                const requestInfo = await oracle.getJobDetails(requestId);
                const votes = await oracle.s_dataIdVotes(requestId, requestInfo.finalResultDataId);
                expect(votes).to.be.greaterThanOrEqual(5);
            }
        });

        it('Should not be able to aggregate if not the original requester', async function () {
            const {
                oracle,
                submitRequest,
                decimal,
                operators: [operator1, operator2],
                accountsWithTokens: [consumer],
            } = await loadFixture(operatorFixture);

            const request: Request = {
                numCount: 2,
                adaFee: ethers.utils.parseEther('1'),
                tokenFee: ethers.utils.parseUnits('100', decimal),
                adaFeePerNum: ethers.utils.parseEther('0.5'),
                tokenFeePerNum: ethers.utils.parseUnits('50', decimal),
                minValidator: BigNumber.from(5),
                maxValidator: BigNumber.from(10),
            };

            const requestId = await submitRequest(request, consumer);
            await ethers.provider.send('evm_increaseTime', [86400]);

            await expect(oracle.connect(operator2).aggregateResult(requestId)).to.be.revertedWithCustomError(
                oracle,
                'NotAuthorized'
            );
        });

        it('Should not be able to aggregate when job acceptance in progress', async function () {
            const {
                oracle,
                submitRequest,
                decimal,
                operators: [operator1, operator2],
                accountsWithTokens: [consumer],
            } = await loadFixture(operatorFixture);

            const request: Request = {
                numCount: 2,
                adaFee: ethers.utils.parseEther('1'),
                tokenFee: ethers.utils.parseUnits('100', decimal),
                adaFeePerNum: ethers.utils.parseEther('0.5'),
                tokenFeePerNum: ethers.utils.parseUnits('50', decimal),
                minValidator: BigNumber.from(5),
                maxValidator: BigNumber.from(10),
            };

            const requestId = await submitRequest(request, consumer);
            await expect(oracle.connect(consumer).aggregateResult(requestId)).to.be.revertedWithCustomError(
                oracle,
                'JobAcceptanceInProgress'
            );
        });

        it('Should not be able to aggregate twice', async function () {
            const {
                oracle,
                submitRequest,
                decimal,
                accountsWithTokens: [consumer],
            } = await loadFixture(operatorFixture);

            const request: Request = {
                numCount: 2,
                adaFee: ethers.utils.parseEther('1'),
                tokenFee: ethers.utils.parseUnits('100', decimal),
                adaFeePerNum: ethers.utils.parseEther('0.5'),
                tokenFeePerNum: ethers.utils.parseUnits('50', decimal),
                minValidator: BigNumber.from(5),
                maxValidator: BigNumber.from(10),
            };

            const requestId = await submitRequest(request, consumer);

            await ethers.provider.send('evm_increaseTime', [86400]);
            await oracle.connect(consumer).aggregateResult(requestId);

            await expect(oracle.connect(consumer).aggregateResult(requestId)).to.be.revertedWithCustomError(
                oracle,
                'JobAlreadyFinalized'
            );
        });
    });

    describe('GetAverageOracleFees function', function () {
        it('Should return zero when no fulfilled requests yet', async function () {
            const { oracle } = await loadFixture(operatorFixture);

            const fees = await oracle.getAverageOracleFees();

            expect(fees.baseToken).to.equal(0);
            expect(fees.token).to.equal(0);
            expect(fees.baseTokenFeePerNum).to.equal(0);
            expect(fees.tokenFeePerNum).to.equal(0);
        });

        it('Should update the average fees as request gets fulfilled', async function () {
            const {
                oracle,
                simulateJobCycle,
                nodes,
                decimal,
                accountsWithTokens: [consumer],
                submitRequest,
                submitResponses,
            } = await loadFixture(operatorFixture);

            const requestIds = await simulateJobCycle(20, nodes, 5, 10);

            let adaFee, adaFeePerNum, tokenFee, tokenFeePerNum;
            let totalAdaFee: BigNumber = ethers.BigNumber.from(0);
            let totalAdaFeePerNum: BigNumber = ethers.BigNumber.from(0);
            let totalTokenFee: BigNumber = ethers.BigNumber.from(0);
            let totalTokenFeePerNum: BigNumber = ethers.BigNumber.from(0);

            for (const requestId of requestIds) {
                const request = await oracle.getJobDetails(requestId);

                totalAdaFeePerNum = totalAdaFeePerNum.add(request.baseTokenFeePerNum);
                totalTokenFeePerNum = totalTokenFeePerNum.add(request.tokenFeePerNum);
                totalAdaFee = totalAdaFee.add(request.baseTokenFee);
                totalTokenFee = totalTokenFee.add(request.baseTokenFee);
            }

            const fees = await oracle.getAverageOracleFees();

            adaFee = totalAdaFee.div(requestIds.length);
            adaFeePerNum = totalAdaFeePerNum.div(requestIds.length);
            tokenFee = totalTokenFee.div(requestIds.length);
            tokenFeePerNum = totalTokenFeePerNum.div(requestIds.length);

            expect(fees.baseToken).to.equal(adaFee);
            expect(fees.token).to.equal(tokenFee);
            expect(fees.baseTokenFeePerNum).to.equal(adaFeePerNum);
            expect(fees.tokenFeePerNum).to.equal(tokenFeePerNum);

            const request: Request = {
                numCount: 2,
                adaFee: ethers.utils.parseEther('10'),
                tokenFee: ethers.utils.parseUnits('2000', decimal),
                adaFeePerNum: ethers.utils.parseEther('1'),
                tokenFeePerNum: ethers.utils.parseUnits('200', decimal),
                minValidator: BigNumber.from(5),
                maxValidator: BigNumber.from(10),
            };

            const requestId = await submitRequest(request, consumer);
            await submitResponses(requestId, nodes);
            await ethers.provider.send('evm_increaseTime', [86400]);
            await oracle.connect(consumer).aggregateResult(requestId);

            const newRequest = await oracle.getJobDetails(requestId);

            totalAdaFee = totalAdaFee.add(newRequest.baseTokenFee);
            totalTokenFee = totalTokenFee.add(newRequest.baseTokenFee);
            totalAdaFeePerNum = totalAdaFeePerNum.add(newRequest.baseTokenFeePerNum);
            totalTokenFeePerNum = totalTokenFeePerNum.add(newRequest.tokenFeePerNum);

            const newFees = await oracle.getAverageOracleFees();

            const newAdaFee = totalAdaFee.div(requestIds.length + 1);
            const newAdaFeePerNum = totalAdaFeePerNum.div(requestIds.length + 1);
            const newTokenFee = totalTokenFee.div(requestIds.length + 1);
            const newTokenFeePerNum = totalTokenFeePerNum.div(requestIds.length + 1);

            expect(newFees.baseToken).to.equal(newAdaFee);
            expect(newFees.token).to.equal(newTokenFee);
            expect(newFees.baseTokenFeePerNum).to.equal(newAdaFeePerNum);
            expect(newFees.tokenFeePerNum).to.equal(newTokenFeePerNum);
        });

        it('Should not add fees when a request gets refunded', async function () {
            const {
                oracle,
                submitRequest,
                nodes,
                decimal,
                accountsWithTokens: [consumer],
            } = await loadFixture(operatorFixture);

            const request: Request = {
                numCount: 2,
                adaFee: ethers.utils.parseEther('10'),
                tokenFee: ethers.utils.parseUnits('2000', decimal),
                adaFeePerNum: ethers.utils.parseEther('1'),
                tokenFeePerNum: ethers.utils.parseUnits('200', decimal),
                minValidator: BigNumber.from(5),
                maxValidator: BigNumber.from(10),
            };

            const requestId = await submitRequest(request, consumer);
            await ethers.provider.send('evm_increaseTime', [86400]);
            await oracle.connect(consumer).aggregateResult(requestId);

            const fees = await oracle.getAverageOracleFees();

            expect(fees.baseToken).to.equal(0);
            expect(fees.token).to.equal(0);
            expect(fees.baseTokenFeePerNum).to.equal(0);
            expect(fees.tokenFeePerNum).to.equal(0);
        });
    });
});
