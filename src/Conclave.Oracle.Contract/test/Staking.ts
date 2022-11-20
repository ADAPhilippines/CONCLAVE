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
                testbaseTokenStake,
                testTokenStake,
                approveAndStake,
            } = await loadFixture(stakingFixture);

            const originalTokenBalance = await token.balanceOf(addr.address);
            await approveAndStake(addr, testbaseTokenStake, testTokenStake);

            const stakes = await oracle.getStake(addr.address);
            expect(await token.balanceOf(addr.address)).to.equal(originalTokenBalance.sub(testTokenStake));
            expect(stakes.baseToken).to.equal(testbaseTokenStake);
            expect(stakes.token).to.equal(testTokenStake);
        });

        it('Should add staker to list of stakers', async function () {
            const {
                oracle,
                accountsWithTokens: [addr],
                testTokenStake,
                testbaseTokenStake,
                approveAndStake,
            } = await loadFixture(stakingFixture);

            await approveAndStake(addr, testbaseTokenStake, testTokenStake);
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
                testbaseTokenStake,
                testTokenStake,
                stake,
            } = await loadFixture(stakingFixture);

            await expect(stake(addr, testbaseTokenStake, testTokenStake)).to.be.revertedWith('ERC20: insufficient allowance');
        });

        it('Should not stake if amount exceeds balance', async function () {
            const {
                oracle,
                accountsWithoutTokens: [addr],
                testbaseTokenStake,
                testTokenStake,
                approve,
            } = await loadFixture(stakingFixture);

            await approve(addr);
            await expect(
                oracle.connect(addr).stake(testbaseTokenStake, testTokenStake, { value: testbaseTokenStake })
            ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
        });

        it('Should not stake invalid amount', async function () {
            const {
                oracle,
                accountsWithTokens: [addr],
                approveAndStake,
            } = await loadFixture(stakingFixture);

            await expect(
                approveAndStake(addr, ethers.BigNumber.from('0'), ethers.BigNumber.from('0'))
            ).to.be.revertedWithCustomError(oracle, 'InvalidStakeAmount');
        });

        it('Should increment total stakes', async function () {
            const { oracle, accountsWithTokens, testbaseTokenStake, testTokenStake, approveAndStake } = await loadFixture(
                stakingFixture
            );

            for (const account of accountsWithTokens) {
                await approveAndStake(account, testbaseTokenStake, testTokenStake);
            }

            const totalStakes = await oracle.s_totalStakes();

            expect(totalStakes.baseToken).to.equal(testbaseTokenStake.mul(accountsWithTokens.length));
            expect(totalStakes.token).to.equal(testTokenStake.mul(accountsWithTokens.length));
        });
    });

    describe('Unstake function', function () {
        it('Should accept valid unstake', async function () {
            const {
                oracle,
                token,
                accountsWithTokens: [addr],
                testbaseTokenStake,
                testTokenStake,
                unstake,
                approveAndStake,
            } = await loadFixture(stakingFixture);

            const originalTokenBalance = await token.balanceOf(addr.address);
            await approveAndStake(addr, testbaseTokenStake, testTokenStake);
            await unstake(addr, testbaseTokenStake, testTokenStake);

            const stakes = await oracle.getStake(addr.address);

            expect(await token.balanceOf(addr.address)).to.equal(originalTokenBalance);
            expect(stakes.baseToken).to.equal(0);
            expect(stakes.token).to.equal(0);
        });

        it('Should not unstake if amount exceeds balance', async function () {
            const {
                oracle,
                accountsWithTokens: [addr],
                testbaseTokenStake,
                testTokenStake,
                unstake,
                approveAndStake,
            } = await loadFixture(stakingFixture);

            await approveAndStake(addr, testbaseTokenStake, testTokenStake);
            await expect(unstake(addr, testbaseTokenStake, testTokenStake.add(100))).to.be.revertedWithCustomError(
                oracle,
                'InsufficientBalance'
            );
        });

        it('Should not unstake invalid amount', async function () {
            const {
                oracle,
                accountsWithTokens: [addr],
                unstake,
            } = await loadFixture(stakingFixture);

            await expect(
                unstake(addr, ethers.BigNumber.from('0'), ethers.BigNumber.from('0'))
            ).to.be.revertedWithCustomError(oracle, 'InvalidStakeAmount');
        });

        it('Should decrement total stakes', async function () {
            const {
                accountsWithTokens: [addr1, addr2, addr3],
                oracle,
                testbaseTokenStake,
                testTokenStake,
                approveAndStake,
                unstake,
                stake,
            } = await loadFixture(stakingFixture);

            for (const account of [addr1, addr2, addr3]) {
                await approveAndStake(account, testbaseTokenStake, testTokenStake);
            }
            await unstake(addr2, testbaseTokenStake, testTokenStake);
            await unstake(addr3, testbaseTokenStake, testTokenStake);
            await stake(addr1, testbaseTokenStake, testTokenStake.add(1000));
            const addr1Stake = await oracle.getStake(addr1.address);
            const stakes = await oracle.s_totalStakes();
            expect(stakes.baseToken).to.equal(addr1Stake.baseToken);
            expect(stakes.token).to.equal(addr1Stake.token);
        });
    });

    describe('GetStake function', function () {
        it('Should return correct stake', async function () {
            const {
                oracle,
                accountsWithTokens: [addr],
                testbaseTokenStake,
                testTokenStake,
                approveAndStake,
            } = await loadFixture(stakingFixture);

            await approveAndStake(addr, testbaseTokenStake, testTokenStake);
            const stakes = await oracle.getStake(addr.address);
            expect(stakes.baseToken).to.equal(testbaseTokenStake);
            expect(stakes.token).to.equal(testTokenStake);
        });
    });
});
