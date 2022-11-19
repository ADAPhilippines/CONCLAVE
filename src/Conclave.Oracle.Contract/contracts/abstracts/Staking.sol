// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/IStakeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract Staking is IStakeable {
    error InsufficientBalance(uint256 requested, uint256 balance);
    error InvalidStakeAmount();

    modifier onlyValidStake(uint256 ada, uint256 token) {
        if (ada == 0 && token == 0) {
            revert InvalidStakeAmount();
        }
        _;
    }

    modifier onlyWithinBalance(uint256 ada, uint256 token) {
        if (ada > address(this).balance) {
            revert InsufficientBalance(ada, address(this).balance);
        }
        if (token > _token.balanceOf(address(this))) {
            revert InsufficientBalance(token, _token.balanceOf(address(this)));
        }
        _;
    }

    IERC20 public immutable _token;

    Stake public s_totalStakes;
    Stake public s_totalPendingStakingRewards;
    address[] public s_stakers;

    mapping(address => Stake) public s_stakes;
    mapping(address => bool) public s_isStakers;

    constructor(IERC20 token) {
        _token = token;
    }

    function getStake(address staker)
        external
        view
        override
        returns (Stake memory)
    {
        return s_stakes[staker];
    }

    function _distributeStakingRewards() internal virtual;

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

    function _transferAda(address to, uint256 amount) internal {
        require(amount > 0, "Amount must be greater than 0");

        payable(to).transfer(amount);
    }

    function _transferToken(address to, uint256 amount) internal {
        require(amount > 0, "Amount must be greater than 0");

        _token.transfer(to, amount);
    }
}
