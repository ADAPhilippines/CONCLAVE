// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/IConclaveOracleOperator.sol";
import "../Staking.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract ConclaveOracleOperator is IConclaveOracleOperator, Staking {
    error InsufficientAllowance(uint256 required, uint256 actual);
    error RequestNotExist();
    error RequestAlreadyFulfilled();
    error ResponseSubmissionNotAuthorized();
    error ResponseAlreadySubmitted();
    error NodeAlreadyRegistered();
    error NodeRegisteredToAdifferentOperator(address registeredOperator);
    error NotEnoughStake(uint256 required, uint256 actual);
    error TimeLimitExceeded(uint256 timeLimit, uint256 actual);
    error InvalidResponse(uint256 expected, uint256 actual);
    error MaxValidatorReached(uint256 maxValidator);
    error MinValidatorNotReached(uint256 minValidator);
    error NoPendingRewards();

    modifier onlyExistingRequest(uint256 jobId) {
        JobRequest storage request = _getJobRequest(jobId);
        if (request.requester == address(0)) {
            revert RequestNotExist();
        }
        _;
    }

    modifier onlyValidator() {
        if (s_stakes[s_nodeToOwner[msg.sender]] < s_minStake) {
            revert NotEnoughStake(
                s_minStake,
                s_stakes[s_nodeToOwner[msg.sender]]
            );
        }
        _;
    }

    modifier onlyUnfilfilledRequests(uint256 jobId) {
        JobRequest storage request = _getJobRequest(jobId);
        if (request.status == RequestStatus.Fulfilled) {
            revert RequestAlreadyFulfilled();
        }
        _;
    }

    modifier onlyWithinTimeLimit(uint256 timelimit) {
        if (block.timestamp > timelimit) {
            revert TimeLimitExceeded(timelimit, block.timestamp);
        }
        _;
    }

    event NodeRegistered(address indexed node, address indexed owner);
    event JobAccepted(
        uint256 indexed jobId,
        address indexed node,
        uint256 jobAcceptanceExpiration
    );
    event ResponseSubmitted(
        uint256 indexed jobId,
        address indexed requester,
        uint256 totalResponseExpected,
        uint256 currentResponse
    );
    event JobRequestMaxValidatorReached(
        uint256 jobId,
        uint32 indexed numCount,
        uint256 indexed jobFulfillmentTimestamp
    );

    struct Rewards {
        uint256 ada;
        uint256 token;
    }

    enum RequestStatus {
        Pending,
        Refunded,
        Fulfilled
    }

    /* ORACLE PROPERTIES */
    struct JobRequest {
        uint256 jobId;
        uint256 baseAdaFee;
        uint256 baseTokenFee;
        uint256 adaFeePerNum;
        uint256 tokenFeePerNum;
        uint256 timestamp;
        uint256 jobAcceptanceExpiration;
        uint256 jobFulfillmentExpiration;
        uint256 finalResultDataId; /* data ID result */
        RequestStatus status;
        uint24 responseCount;
        uint24 numCount;
        uint24 minValidator;
        uint24 maxValidator;
        address requester;
        address[] validators;
        uint256[] dataIds;
    }

    uint256 private s_distributorRandomNumber;
    uint256 private s_slashingAmount;
    uint256 private s_minAdaStakingRewards;
    uint256 private s_minTokenStakingRewards;
    uint256 public s_feesCollected;
    uint256 public s_tokenFeesCollected;

    mapping(uint256 => uint256[]) /* dataId => random numbers */
        private s_jobRandomNumbers;
    mapping(address => Rewards) /* operator => rewards */
        private s_validatorRewards;
    mapping(address => uint256) /* operator => totalRewards */
        private s_totalSlashedTokens;
    mapping(address => address) /* owner => node */
        private s_ownerToNode;
    mapping(address => address) /* node => owner */
        private s_nodeToOwner;
    mapping(address => uint256[]) /* operator => pendingRewardJobIds */
        private s_pendingRewardJobIds;
    mapping(address => Rewards) /* operator => totalStakingRewards */
        public s_operatorStakingRewards;
    mapping(address => uint256) /* jobId => operator => adaBalances */
        private s_operatorAdaBalances;

    mapping(uint256 => mapping(address => uint256)) /* jobId => node => dataId */
        public s_nodeDataId;
    mapping(uint256 => mapping(uint256 => uint32)) /*jobId => dataId => votes */
        public s_dataIdVotes;
    mapping(uint256 => mapping(address => bool)) /* jobId => node => isRegistered */
        public s_nodeRegistrations;

    address public s_latestDistributorNode;

    constructor(
        IERC20 token,
        uint256 minValidatorStake,
        uint256 slashingAmount,
        uint256 minAdaStakingRewards,
        uint256 minTokenStakingRewards
    ) Staking(token, minValidatorStake) {
        s_slashingAmount = slashingAmount;
        s_minAdaStakingRewards = minAdaStakingRewards;
        s_minTokenStakingRewards = minTokenStakingRewards;
    }

    function delegateNode(address node) external override {
        if (
            s_nodeToOwner[node] != msg.sender &&
            s_nodeToOwner[node] != address(0)
        ) {
            revert NodeRegisteredToAdifferentOperator(s_nodeToOwner[node]);
        }

        if (s_ownerToNode[msg.sender] == node) {
            revert NodeAlreadyRegistered();
        }
        s_nodeToOwner[s_ownerToNode[msg.sender]] = address(0);
        s_ownerToNode[msg.sender] = node;
        s_nodeToOwner[node] = msg.sender;

        emit NodeRegistered(node, msg.sender);
    }

    function acceptJob(uint256 jobId)
        external
        override
        onlyExistingRequest(jobId)
        onlyValidator
        onlyUnfilfilledRequests(jobId)
        onlyWithinTimeLimit(_getJobRequest(jobId).jobAcceptanceExpiration)
    {
        JobRequest storage request = _getJobRequest(jobId);

        if (s_nodeRegistrations[jobId][s_nodeToOwner[msg.sender]]) {
            revert NodeAlreadyRegistered();
        }

        if (request.validators.length >= request.maxValidator) {
            revert MaxValidatorReached(request.maxValidator);
        }

        s_nodeRegistrations[jobId][s_nodeToOwner[msg.sender]] = true;
        s_pendingRewardJobIds[s_nodeToOwner[msg.sender]].push(jobId);
        request.validators.push(msg.sender);

        emit JobAccepted(jobId, msg.sender, request.jobAcceptanceExpiration);
        if (request.validators.length == request.maxValidator) {
            emit JobRequestMaxValidatorReached(
                jobId,
                request.numCount,
                request.jobFulfillmentExpiration
            );
        }
    }

    function submitResponse(uint256 jobId, uint256[] calldata response)
        external
        override
        onlyExistingRequest(jobId)
        onlyValidator
        onlyUnfilfilledRequests(jobId)
        onlyWithinTimeLimit(_getJobRequest(jobId).jobFulfillmentExpiration)
    {
        JobRequest storage request = _getJobRequest(jobId);

        if (!s_nodeRegistrations[jobId][s_nodeToOwner[msg.sender]]) {
            revert ResponseSubmissionNotAuthorized();
        }

        if (s_nodeDataId[jobId][s_nodeToOwner[msg.sender]] != 0) {
            revert ResponseAlreadySubmitted();
        }

        if (response.length != request.numCount) {
            revert InvalidResponse(request.numCount, response.length);
        }

        if (request.validators.length < request.minValidator) {
            revert MinValidatorNotReached(request.minValidator);
        }

        uint256 dataId = _getDataId(
            jobId,
            response,
            request.timestamp,
            request.requester
        );
        s_nodeDataId[jobId][s_nodeToOwner[msg.sender]] = dataId;
        request.responseCount += 1;
        s_dataIdVotes[jobId][dataId] += 1;

        if (s_jobRandomNumbers[dataId].length == 0) {
            s_jobRandomNumbers[dataId] = response;
        }

        if (s_dataIdVotes[jobId][dataId] == 1) {
            request.dataIds.push(dataId);
        }

        s_distributorRandomNumber = uint256(
            keccak256(
                abi.encodePacked(
                    s_distributorRandomNumber,
                    dataId,
                    block.timestamp
                )
            )
        );

        emit ResponseSubmitted(
            jobId,
            request.requester,
            request.validators.length,
            request.responseCount
        );

        // Check if it's time to distribute staking rewards and if msg.sender is the distributor and then distribute rewards
        if (
            s_feesCollected >= s_minAdaStakingRewards &&
            s_tokenFeesCollected >= s_minTokenStakingRewards
        ) {
            if (_isDistributorNode(msg.sender)) {
                s_latestDistributorNode = msg.sender;
                _distributeStakingRewards(msg.sender);
            }
        }
    }

    function getJobDetails(uint256 jobId)
        external
        view
        returns (JobRequest memory)
    {
        return _getJobRequest(jobId);
    }

    function isJobReady(uint256 jobId) external view override returns (bool) {
        JobRequest storage request = _getJobRequest(jobId);
        return block.timestamp > request.jobAcceptanceExpiration;
    }

    function isResponseSubmitted(uint256 jobId)
        external
        view
        override
        returns (bool)
    {
        return s_nodeDataId[jobId][s_nodeToOwner[msg.sender]] != 0;
    }

    function getPendingRewards(uint256 jobId)
        public
        view
        override
        returns (uint256 ada, uint256 token)
    {
        JobRequest storage request = _getJobRequest(jobId);

        if (
            s_nodeDataId[jobId][s_nodeToOwner[msg.sender]] ==
            request.finalResultDataId
        ) {
            uint256 weight = _calculateWeight(
                1,
                s_dataIdVotes[jobId][request.finalResultDataId]
            );
            uint256 totalAda = _calculateShare(
                90 * 100,
                (request.baseAdaFee + request.adaFeePerNum * request.numCount)
            );
            uint256 totalToken = _calculateShare(
                90 * 100,
                (request.baseTokenFee +
                    request.tokenFeePerNum *
                    request.numCount)
            );
            ada = _calculateShare(weight, totalAda);
            token = _calculateShare(weight, totalToken);
        }
    }

    function claimPendingRewards() external {
        if (s_pendingRewardJobIds[s_nodeToOwner[msg.sender]].length == 0) {
            revert NoPendingRewards();
        }

        for (
            uint i = 0;
            i < s_pendingRewardJobIds[s_nodeToOwner[msg.sender]].length;
            i++
        ) {
            JobRequest storage request = _getJobRequest(
                s_pendingRewardJobIds[s_nodeToOwner[msg.sender]][i]
            );
            if (
                s_nodeDataId[request.jobId][msg.sender] ==
                request.finalResultDataId
            ) {
                (uint256 ada, uint256 token) = getPendingRewards(
                    s_pendingRewardJobIds[s_nodeToOwner[msg.sender]][i]
                );
                s_validatorRewards[s_nodeToOwner[msg.sender]].ada += ada;
                s_validatorRewards[s_nodeToOwner[msg.sender]].token += token;
            } else {
                s_stakes[s_nodeToOwner[msg.sender]] -= s_slashingAmount;
                s_totalSlashedTokens[
                    s_nodeToOwner[msg.sender]
                ] += s_slashingAmount;
                s_tokenFeesCollected += s_slashingAmount;
            }
        }

        delete s_pendingRewardJobIds[s_nodeToOwner[msg.sender]];
    }

    function getTotalRewards()
        external
        view
        override
        returns (uint256, uint256)
    {
        return (
            s_validatorRewards[s_nodeToOwner[msg.sender]].ada,
            s_validatorRewards[s_nodeToOwner[msg.sender]].token
        );
    }

    function _isDistributorNode(address node) internal view returns (bool) {
        uint256 randomNumber = s_distributorRandomNumber % 100;
        uint256 randomNumberWeight = randomNumber * 100;
        uint256 weight = _calculateWeight(
            s_stakes[s_nodeToOwner[node]],
            s_totalStakes
        );

        return randomNumberWeight <= weight;
    }

    function _distributeStakingRewards(address node) internal {
        uint256 distributorAdaShare = _calculateShare(
            10 * 100,
            s_feesCollected
        );
        uint256 distributorTokenShare = _calculateShare(
            10 * 100,
            s_tokenFeesCollected
        );
        uint256 stakerAdaShare = s_feesCollected - distributorAdaShare;
        uint256 stakerTokenShare = s_tokenFeesCollected - distributorTokenShare;

        s_feesCollected = 0;
        s_tokenFeesCollected = 0;

        s_operatorStakingRewards[s_nodeToOwner[node]]
            .ada += distributorAdaShare;
        s_operatorAdaBalances[s_nodeToOwner[node]] += distributorAdaShare;
        s_operatorStakingRewards[s_nodeToOwner[node]]
            .token += distributorTokenShare;
        s_stakes[s_nodeToOwner[node]] += distributorTokenShare;

        for (uint i = 0; i < s_stakers.length; i++) {
            uint256 weight = _calculateWeight(
                s_stakes[s_stakers[i]],
                s_totalStakes
            );
            uint256 adaShare = _calculateShare(weight, stakerAdaShare);
            uint256 tokenShare = _calculateShare(weight, stakerTokenShare);
            s_operatorStakingRewards[s_stakers[i]].ada += adaShare;
            s_operatorAdaBalances[s_stakers[i]] += adaShare;
            s_operatorStakingRewards[s_stakers[i]].token += tokenShare;
            s_stakes[s_stakers[i]] += tokenShare;
        }
    }

    function _getRandomNumbers(uint256 dataId)
        internal
        view
        returns (uint256[] memory)
    {
        return s_jobRandomNumbers[dataId];
    }

    function _getDataId(
        uint256 jobId,
        uint256[] calldata data,
        uint256 timestamp,
        address requester
    ) internal pure returns (uint256) {
        return
            uint256(
                keccak256(abi.encodePacked(jobId, data, timestamp, requester))
            );
    }

    function _getJobRequest(uint256 jobId)
        internal
        view
        virtual
        returns (JobRequest storage);

    function _calculateShare(uint256 share, uint256 total)
        internal
        pure
        returns (uint256)
    {
        return (total * share) / 10_000;
    }

    function _calculateWeight(uint256 amount, uint256 total)
        internal
        pure
        returns (uint256)
    {
        return (amount * 10_000) / total;
    }

    function calculateShare(uint256 share, uint256 total)
        public
        pure
        returns (uint256)
    {
        return (total * share) / 10_000;
    }

    function getOwner(address node) external view returns (address) {
        return s_nodeToOwner[node];
    }

    function getNode(address owner) external view returns (address) {
        return s_ownerToNode[owner];
    }

    function getPendingRewardJobIds(address node)
        external
        view
        returns (uint256[] memory)
    {
        return s_pendingRewardJobIds[s_nodeToOwner[node]];
    }
}
