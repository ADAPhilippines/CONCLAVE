// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IConclaveOracleOperator {
    struct JobRequest {
        uint256 jobId;
        uint256 baseBaseTokenFee;
        uint256 baseTokenFee;
        uint256 baseTokenFeePerNum;
        uint256 tokenFeePerNum;
        uint256 timestamp;
        uint256 seed;
        uint256 jobAcceptanceExpiration;
        uint256 jobFulfillmentExpiration;
        uint256 jobExpiration;
        uint256 finalResultDataId;
        uint24 responseCount;
        uint24 numCount;
        uint24 minValidator;
        uint24 maxValidator;
        address requester;
        address aggregator;
        address[] validators;
        uint256[] dataIds;
        uint256[] results;
        RequestStatus status;
    }

    enum RequestStatus {
        Pending,
        Refunded,
        Fulfilled
    }

    function delegateNode(address node) external;

    function setNodeAllowance(uint24 allowance) external;

    function acceptJob(uint256 jobId) external;

    function submitResponse(uint256 jobIb, uint256[] calldata response)
        external;

    function getJobDetails(uint256 jobId)
        external
        view
        returns (JobRequest memory);

    function getPendingRewardsByJobId(uint256 jobId)
        external
        view
        returns (uint256 reward, uint256 tokenReward);

    function getTotalRewards()
        external
        view
        returns (uint256 reward, uint256 tokenReward);

    function getOwner(address node) external view returns (address owner);

    function getNode(address owner) external view returns (address node);

    function getNodeAllowance(address node) external view returns (uint256);

    function getPendingRewardJobIds(address node)
        external
        view
        returns (uint256[] memory);

    function getTotalPendingRewards()
        external
        view
        returns (uint256 baseTokenReward, uint256 tokenReward);

    function claimPendingRewards() external;

    function isJobReady(uint256 jobId) external view returns (bool);

    function isResponseSubmitted(uint256 jobId) external view returns (bool);

    function isNodeRegistered(address node) external view returns (bool);
}
