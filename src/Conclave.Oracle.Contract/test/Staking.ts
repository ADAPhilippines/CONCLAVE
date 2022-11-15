import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { ethers } from 'hardhat';
import { BigNumber } from 'ethers';
import { stakingFixture } from './Fixture';

describe('Staking Contract', function () {
    describe('Stake function', function () {
        it('Should accept valid stake', async function () {
            const {
                oracle,
                token,
                accountsWithTokens: [addr],
                testStakeAmount,
                approveAndStake,
            } = await loadFixture(stakingFixture);

            const originalTokenBalance = await token.balanceOf(addr.address);
            await approveAndStake(addr, testStakeAmount);

            expect(await token.balanceOf(addr.address)).to.equal(originalTokenBalance.sub(testStakeAmount));
            expect(await oracle.getStake(addr.address)).to.equal(testStakeAmount);
            expect(await oracle.s_totalStakes()).to.equal(testStakeAmount);
        });

        it('Should add staker to list of stakers', async function () {
            const {
                oracle,
                accountsWithTokens: [addr],
                testStakeAmount,
                approveAndStake,
            } = await loadFixture(stakingFixture);

            await approveAndStake(addr, testStakeAmount);
            expect(await oracle.s_isStakers(addr.address)).to.equal(true);
        });

        it('Should not add staker to list of stakers', async function () {
            const {
                oracle,
                accountsWithTokens: [addr],
            } = await loadFixture(stakingFixture);

            expect(await oracle.s_isStakers(addr.address)).to.equal(false);
        });

        it('Should not stake if insufficient allowance', async function () {
            const {
                accountsWithoutTokens: [addr],
                testStakeAmount,
                stake,
            } = await loadFixture(stakingFixture);

            await expect(stake(addr, testStakeAmount)).to.be.revertedWith('ERC20: insufficient allowance');
        });

        it('Should not stake if amount exceeds balance', async function () {
            const {
                oracle,
                accountsWithoutTokens: [addr],
                testStakeAmount,
                approve,
            } = await loadFixture(stakingFixture);

            await approve(addr);
            await expect(oracle.connect(addr).stake(testStakeAmount)).to.be.revertedWith('ERC20: transfer amount exceeds balance');
        });

        it('Should not stake invalid amount', async function () {
            const {
                accountsWithTokens: [addr],
                approveAndStake,
            } = await loadFixture(stakingFixture);

            await expect(approveAndStake(addr, ethers.BigNumber.from('0'))).to.be.revertedWith('Staking: Amount must be greater than 0');
        });

        it('Should increment total stakes', async function () {
            const { oracle, accountsWithTokens, testStakeAmount, approveAndStake } = await loadFixture(stakingFixture);

            for (const account of accountsWithTokens) {
                await approveAndStake(account, testStakeAmount);
            }

            expect(await oracle.s_totalStakes()).to.equal(testStakeAmount.mul(accountsWithTokens.length));
        });
    });

    describe('Unstake function', function () {
        it('Should accept valid unstake', async function () {
            const {
                oracle,
                token,
                accountsWithTokens: [addr],
                testStakeAmount,
                unstake,
                approveAndStake,
            } = await loadFixture(stakingFixture);

            const originalTokenBalance = await token.balanceOf(addr.address);
            await approveAndStake(addr, testStakeAmount);
            await unstake(addr, testStakeAmount);

            expect(await token.balanceOf(addr.address)).to.equal(originalTokenBalance);
            expect(await oracle.getStake(addr.address)).to.equal(0);
        });

        it('Should not accept if amount exceeds balance', async function () {
            const {
                oracle,
                accountsWithTokens: [addr],
                testStakeAmount,
                unstake,
                approveAndStake,
            } = await loadFixture(stakingFixture);

            await approveAndStake(addr, testStakeAmount);
            await expect(unstake(addr, testStakeAmount.add(100))).to.be.revertedWithCustomError(oracle, 'InsufficientBalance');
        });

        it('Should not unstake invalid amount', async function () {
            const {
                accountsWithTokens: [addr],
                unstake,
            } = await loadFixture(stakingFixture);

            await expect(unstake(addr, ethers.BigNumber.from('0'))).to.be.revertedWith('Staking: Amount must be greater than 0');
        });

        it('Should decrement total stakes', async function () {
            const {
                accountsWithTokens: [addr1, addr2, addr3],
                oracle,
                testStakeAmount,
                approveAndStake,
                unstake,
            } = await loadFixture(stakingFixture);

            for (const account of [addr1, addr2, addr3]) {
                await approveAndStake(account, testStakeAmount);
            }

            await unstake(addr1, testStakeAmount);
            expect(await oracle.s_totalStakes()).to.equal(testStakeAmount.mul(2));
        });
    });

    describe('GetStake function', function () {
        it('Should return correct stake', async function () {
            const {
                oracle,
                accountsWithTokens: [addr],
                testStakeAmount,
                approveAndStake,
            } = await loadFixture(stakingFixture);

            await approveAndStake(addr, testStakeAmount);
            expect(await oracle.getStake(addr.address)).to.equal(testStakeAmount);
        });
    });
});