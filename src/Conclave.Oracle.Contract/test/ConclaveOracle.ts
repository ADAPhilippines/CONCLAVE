import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';
import { operatorFixture, delegateNodeFixture, Request } from './Fixture';

describe.only('ConclaveOracle contract', function () {
    describe('RequestRandomNumbers function', function () {
        it('Should accept valid requests', async function () {
            const { oracle, consumer, submitRequest, decimal } = await loadFixture(operatorFixture);

            const request: Request = {
                numCount: 2,
                adaFee: ethers.utils.parseEther('1'),
                tokenFee: ethers.utils.parseUnits('100', decimal),
                adaFeePerNum: ethers.utils.parseEther('0.5'),
                tokenFeePerNum: ethers.utils.parseUnits('50', decimal),
                minValidator: BigNumber.from(3),
                maxValidator: BigNumber.from(5),
            };

            const requestId = await submitRequest(request);
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
            const { oracle, submitRequest, decimal } = await loadFixture(operatorFixture);

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

            await expect(submitRequest(notWithinMinRequest)).to.be.revertedWithCustomError(
                oracle,
                'NumberCountNotInRange'
            );
            await expect(submitRequest(notWithinMaxRequest)).to.be.revertedWithCustomError(
                oracle,
                'NumberCountNotInRange'
            );
        });

        it('Should not accept invalid validator range', async function () {
            const { oracle, submitRequest, decimal } = await loadFixture(operatorFixture);

            const request: Request = {
                numCount: 2,
                adaFee: ethers.utils.parseEther('1'),
                tokenFee: ethers.utils.parseUnits('100', decimal),
                adaFeePerNum: ethers.utils.parseEther('0.5'),
                tokenFeePerNum: ethers.utils.parseUnits('50', decimal),
                minValidator: BigNumber.from(6),
                maxValidator: BigNumber.from(2),
            };

            await expect(submitRequest(request)).to.be.revertedWithCustomError(oracle, 'InvalidValidatorRange');
        });

        it('Should not accept if fees sent do the match the amount specified', async function () {
            const { oracle, consumer, decimal, token } = await loadFixture(operatorFixture);

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
                consumer.requestRandomNumbers(
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
                consumer.requestRandomNumbers(
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
            const { oracle, submitRequest, decimal } = await loadFixture(operatorFixture);

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
            await submitRequest(request);
            const balanceAfter = await oracle.balance();
            expect(balanceAfter.ada).to.equal(balanceBefore.ada.add(totalAdaFee));
            expect(balanceAfter.token).to.equal(balanceBefore.token.add(totalTokenFee));
        });

        it('Should tag request properly', async function () {
            const { oracle, consumer, simulateJobCycle, submitRequest, nodes, decimal } = await loadFixture(
                operatorFixture
            );

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

            const requestId = await submitRequest(request);
            const requestInfo = await oracle.getJobDetails(requestId);
            expect(requestInfo.status).to.equal(0);
            await ethers.provider.send('evm_increaseTime', [86400]);
            await consumer.finalizeResult(requestId);

            const updatedDequestInfo = await oracle.getJobDetails(requestId);
            expect(updatedDequestInfo.status).to.equal(1);
        });
    });

    describe('AggregateResult function', function () {
        it('Should deduct the fees to contract balance in case of a refund', async function () {
            const { oracle, submitRequest, decimal, consumer } = await loadFixture(operatorFixture);

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
            const requestId = await submitRequest(request);

            await ethers.provider.send('evm_increaseTime', [86400]);
            await consumer.finalizeResult(requestId);

            const balanceAfter = await oracle.balance();

            const requestInfo = await oracle.getJobDetails(requestId);

            expect(balanceBefore.ada).to.equal(balanceAfter.ada);
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

            const requestId = await submitRequest(request);
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
                consumer,
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

            const requestId = await submitRequest(request);
            await expect(consumer.finalizeResult(requestId)).to.be.revertedWithCustomError(
                oracle,
                'JobAcceptanceInProgress'
            );
        });

        it('Should not be able to aggregate twice', async function () {
            const { oracle, submitRequest, decimal, consumer } = await loadFixture(operatorFixture);

            const request: Request = {
                numCount: 2,
                adaFee: ethers.utils.parseEther('1'),
                tokenFee: ethers.utils.parseUnits('100', decimal),
                adaFeePerNum: ethers.utils.parseEther('0.5'),
                tokenFeePerNum: ethers.utils.parseUnits('50', decimal),
                minValidator: BigNumber.from(5),
                maxValidator: BigNumber.from(10),
            };

            const requestId = await submitRequest(request);

            await ethers.provider.send('evm_increaseTime', [86400]);
            await consumer.finalizeResult(requestId);

            await expect(consumer.finalizeResult(requestId)).to.be.revertedWithCustomError(
                oracle,
                'JobAlreadyFinalized'
            );
        });
    });
});
