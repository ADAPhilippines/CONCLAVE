// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IStakeable {
    function stake(uint256 amount) external;

    function unstake(uint256 amount) external;

    function getStake(address account) external view returns (uint256);
}
