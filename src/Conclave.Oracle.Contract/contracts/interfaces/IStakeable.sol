// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IStakeable {
    struct Stake {
        uint256 baseToken;
        uint256 token;
    }

    function stake(uint256 baseToken, uint256 token) external payable;

    function unstake(uint256 baseToken, uint256 token) external;

    function getStake(address staker) external view returns (Stake memory);
}
