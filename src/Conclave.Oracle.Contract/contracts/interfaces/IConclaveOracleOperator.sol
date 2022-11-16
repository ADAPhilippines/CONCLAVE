// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IConclaveOracleOperator {
    function delegateNode(address node) external;

    function acceptJob(uint256 jobId) external;

    function submitResponse(uint256 jobIb, uint256[] calldata response)
        external;

    function isJobReady(uint256 jobId) external view returns (bool);

    function isResponseSubmitted(uint256 jobId) external view returns (bool);

    function getPendingRewards(uint256 jobId)
        external
        view
        returns (uint256 reward, uint256 tokenReward);

    function getTotalRewards()
        external
        view
        returns (uint256 reward, uint256 tokenReward);

    function claimPendingRewards() external;
}
