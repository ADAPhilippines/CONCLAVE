import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';
import { operatorFixture, delegateNodeFixture } from './Fixture';

describe('ConclaveOperator Contract', function () {
    describe.only('DelegateNode function', function () {
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
            await expect(oracle.connect(operator).delegateNode(node.address)).to.be.revertedWithCustomError(oracle, 'NodeAlreadyRegistered');
        });
    });

    describe.only('AcceptJob function', function () {
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
            expect(job.validators.includes(node.address)).to.equal(true);
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
            await expect(oracle.connect(node).acceptJob(sampleRequestId)).to.be.revertedWithCustomError(oracle, 'NodeAlreadyRegistered');
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
            await oracle.connect(operator).unstake(operatorBalance);

            await expect(oracle.connect(node).acceptJob(sampleRequestId)).to.be.revertedWithCustomError(oracle, 'NotEnoughStake');
        });

        it('Should not be able to accept job if time limit reached', async function () {
            const {
                oracle,
                nodes: [node],
                sampleRequestId,
            } = await loadFixture(operatorFixture);

            await ethers.provider.send('evm_increaseTime', [61]);
            await expect(oracle.connect(node).acceptJob(sampleRequestId)).to.be.revertedWithCustomError(oracle, 'TimeLimitExceeded');
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

    describe.only('SubmitResult function', function () {
        it('Should submit result', async function () {
            const {
                oracle,
                nodes: [node],
                operators: [operator],
                sampleRequestId,
                getResponse,
            } = await loadFixture(operatorFixture);

            await oracle.connect(node).acceptJob(sampleRequestId);
            const jobDetails = await oracle.getJobDetails(sampleRequestId);
            await ethers.provider.send('evm_increaseTime', [61]);
            const response = getResponse(jobDetails.numCount);
            await oracle.connect(node).submitResponse(sampleRequestId, response);

            const nodeSubmission = await oracle.s_nodeDataId(sampleRequestId, operator.address);
            const dataHash = ethers.utils.keccak256(
                ethers.utils.solidityPack(
                    ['uint256', 'uint256[]', 'uint256', 'address'],
                    [jobDetails.jobId, response, jobDetails.timestamp, jobDetails.requester]
                )
            );
            const dataId = ethers.BigNumber.from(dataHash);

            expect(nodeSubmission).to.equal(dataId);
        });
    });
});
