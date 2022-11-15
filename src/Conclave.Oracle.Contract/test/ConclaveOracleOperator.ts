import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';
import { operatorFixture } from './Fixture';

describe('ConclaveOperator Contract', function () {
    describe('DelegateNode function', function () {
        it('Should delegate node', async function () {
            const {
                oracle,
                accountsWithTokens: [operator],
                accountsWithoutTokens: [node],
            } = await loadFixture(operatorFixture);

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
            } = await loadFixture(operatorFixture);

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
            } = await loadFixture(operatorFixture);

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
            } = await loadFixture(operatorFixture);

            await oracle.connect(operator).delegateNode(node.address);
            await expect(oracle.connect(operator).delegateNode(node.address)).to.be.revertedWithCustomError(oracle, 'NodeAlreadyRegistered');
        });
    });
});
