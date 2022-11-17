// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/IStakeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract Staking is IStakeable {
    /* STAKING PROPERTIES */
    IERC20 public immutable _token;
    Stake public s_totalStakes;
    mapping(address => Stake) public s_stakes;
    address[] public s_stakers;

    mapping(address => bool) public s_isStakers;

    error InsufficientBalance(uint256 requested, uint256 balance);
    error InvalidStakeAmount();

    modifier onlyValidStake(uint256 ada, uint256 token) {
        if (ada == 0 && token == 0) {
            revert InvalidStakeAmount();
        }
        _;
    }

    constructor(IERC20 token) {
        _token = token;
    }

    function _stake(uint256 ada, uint256 token)
        internal
        onlyValidStake(ada, token)
    {
        _token.transferFrom(msg.sender, address(this), token);
        _addStake(msg.sender, ada, token);
    }

    function _unstake(uint256 ada, uint256 token)
        internal
        onlyValidStake(ada, token)
    {
        _subStake(msg.sender, ada, token);
        _token.transfer(msg.sender, token);
        payable(msg.sender).transfer(ada);
    }

    function _addStake(
        address staker,
        uint256 ada,
        uint256 token
    ) internal {
        s_stakes[staker].ada += ada;
        s_stakes[staker].token += token;
        s_totalStakes.ada += ada;
        s_totalStakes.token += token;

        if (!s_isStakers[staker]) {
            s_isStakers[staker] = true;
            s_stakers.push(staker);
        }
    }

    function _subStake(
        address staker,
        uint256 ada,
        uint256 token
    ) internal {
        s_stakes[staker].ada -= ada;
        s_stakes[staker].token -= token;
        s_totalStakes.ada -= ada;
        s_totalStakes.token -= token;
    }

    function _distributeStakingRewards() internal virtual;

    function getStake(address staker)
        external
        view
        override
        returns (Stake memory)
    {
        return s_stakes[staker];
    }
}
