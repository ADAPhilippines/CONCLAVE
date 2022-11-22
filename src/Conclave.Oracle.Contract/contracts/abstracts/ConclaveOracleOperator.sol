// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/IConclaveOracleOperator.sol";
import "./Staking.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

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
        if (!_hasEnoughStakes(s_nodeToOwner[msg.sender])) {
            revert NotEnoughStake(
                s_minStake.baseToken,
                s_stakes[s_nodeToOwner[msg.sender]].baseToken
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
        address indexed node,
        uint256 totalResponseExpected,
        uint256 currentResponse
    );
    event JobRequestMaxValidatorReached(
        uint256 jobId,
        uint32 indexed numCount,
        uint256 indexed jobFulfillmentTimestamp
    );

    struct PendingRewardJobIds {
        uint256[] pending;
        uint256[] finalized;
    }

    uint256 private s_distributorRandomNumber;
    uint256 private s_minbaseTokenStakingRewards;
    uint256 private s_minTokenStakingRewards;
    Stake public s_minStake;

    mapping(uint256 => uint256[]) /* dataId => random numbers */
        private s_jobRandomNumbers;
    mapping(address => Stake) /* operator => rewards */
        public s_totalNodeRewards;
    mapping(address => Stake) /* operator => totalRewards */
        public s_totalDeductedStakes;
    mapping(address => Stake) /* operator => totalStakingRewards */
        public s_totalStakingRewards;
    mapping(address => address) /* owner => node */
        private s_ownerToNode;
    mapping(address => address) /* node => owner */
        private s_nodeToOwner;
    mapping(address => uint256[]) /* operator => pendingRewardJobIds */
        private s_pendingRewardJobIds;
    mapping(uint256 => mapping(address => uint256)) /* jobId => operator => dataId */
        public s_nodeDataId;
    mapping(uint256 => mapping(uint256 => uint32)) /*jobId => dataId => votes */
        public s_dataIdVotes;
    mapping(uint256 => mapping(address => bool)) /* jobId => operator => isRegistered */
        public s_nodeRegistrations;
    mapping(address => uint24) /* operator => nodeAllowance */
        public s_nodeAllowances;
    mapping(address => PendingRewardJobIds) /* operator => pendingRewardJobIds */
        private s_operatorPendingRewardJobIds;

    address public s_latestDistributorNode;

    constructor(
        IERC20 token,
        uint256 minbaseTokenStakingRewards,
        uint256 minTokenStakingRewards,
        uint256 minbaseTokenStake,
        uint256 minTokenStake
    ) Staking(token) {
        s_minbaseTokenStakingRewards = minbaseTokenStakingRewards;
        s_minTokenStakingRewards = minTokenStakingRewards;
        s_minStake.baseToken = minbaseTokenStake;
        s_minStake.token = minTokenStake;
    }

    function stake(uint256 baseToken, uint256 token) external payable override {
        _stake(baseToken, token);
    }

    function unstake(uint256 baseToken, uint256 token)
        external
        override
        onlyWithinBalance(baseToken, token)
    {
        if (s_pendingRewardJobIds[msg.sender].length > 0) {
            uint256 remainingbaseToken = s_stakes[msg.sender].baseToken -
                baseToken;
            uint256 remainingToken = s_stakes[msg.sender].token - token;

            if (
                remainingbaseToken < s_minStake.baseToken ||
                remainingToken < s_minStake.token
            ) {
                revert(
                    "Cannot unstake below minimum stake when there's pending rewards"
                );
            }
        }
        _unstake(baseToken, token);
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

    function setNodeAllowance(uint24 allowance) external override {
        require(allowance <= 100 && allowance >= 0, "Invalid allowance");
        s_nodeAllowances[msg.sender] = allowance;
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
        request.validators.push(s_nodeToOwner[msg.sender]);

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
            msg.sender,
            request.validators.length,
            request.responseCount
        );

        // Check if it's time to distribute staking rewards and if msg.sender is the distributor and then distribute rewards
        if (
            s_totalPendingStakingRewards.baseToken >=
            s_minbaseTokenStakingRewards &&
            s_totalPendingStakingRewards.token >= s_minTokenStakingRewards
        ) {
            if (_isDistributorNode(msg.sender)) {
                s_latestDistributorNode = msg.sender;

                emit StakingRewardsDistributed(
                    s_nodeToOwner[msg.sender],
                    s_totalPendingStakingRewards.baseToken,
                    s_totalPendingStakingRewards.token,
                    block.timestamp
                );

                _distributeStakingRewards();
            }
        }
    }

    function getJobDetails(uint256 jobId)
        external
        view
        override
        returns (JobRequest memory)
    {
        return _getJobRequest(jobId);
    }

    function getTotalPendingRewards()
        external
        view
        returns (uint256 baseTokenReward, uint256 tokenReward)
    {
        uint256[] storage jobIds = s_pendingRewardJobIds[
            s_nodeToOwner[msg.sender]
        ];
        for (uint256 i = 0; i < jobIds.length; i++) {
            (uint256 baseToken, uint256 token) = getPendingRewardsByJobId(
                jobIds[i]
            );
            baseTokenReward += baseToken;
            tokenReward += token;
        }
    }

    function getPendingRewardsByJobId(uint256 jobId)
        public
        view
        override
        returns (uint256 baseToken, uint256 token)
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

            uint256 totalSharePercentage = 90 * 100;
            if (request.aggregator != address(0)) {
                totalSharePercentage = 80 * 100;
            }

            uint256 totalBaseToken = _calculateShare(
                totalSharePercentage,
                request.baseBaseTokenFee +
                    (request.baseTokenFeePerNum * request.numCount)
            );
            uint256 totalToken = _calculateShare(
                totalSharePercentage,
                request.baseTokenFee +
                    (request.tokenFeePerNum * request.numCount)
            );
            baseToken = _calculateShare(weight, totalBaseToken);
            token = _calculateShare(weight, totalToken);

            if (
                request.aggregator != address(0) &&
                msg.sender == request.aggregator
            ) {
                baseToken += _calculateShare(10 * 100, totalBaseToken);
                token += _calculateShare(10 * 100, totalToken);
            }
        }
    }

    function claimPendingRewards() external {
        _filterPendingJobs(s_pendingRewardJobIds[s_nodeToOwner[msg.sender]]);

        uint256[] storage finalizedJobIds = s_operatorPendingRewardJobIds[
            s_nodeToOwner[msg.sender]
        ].finalized;

        uint256[] storage pendingJobIds = s_operatorPendingRewardJobIds[
            s_nodeToOwner[msg.sender]
        ].pending;

        if (finalizedJobIds.length == 0) {
            revert NoPendingRewards();
        }

        uint256 baseTokenReward = 0;
        for (uint i = 0; i < finalizedJobIds.length; i++) {
            JobRequest storage request = _getJobRequest(finalizedJobIds[i]);
            uint256 nodeDataId = s_nodeDataId[request.jobId][
                s_nodeToOwner[msg.sender]
            ];

            uint256 baseTokenFee = request.baseBaseTokenFee +
                (request.baseTokenFeePerNum * request.numCount);
            uint256 tokenFee = request.baseTokenFee +
                (request.tokenFeePerNum * request.numCount);

            if (nodeDataId == request.finalResultDataId) {
                // Add rewards to stake balances
                (uint256 baseToken, uint256 token) = getPendingRewardsByJobId(
                    request.jobId
                );
                s_totalNodeRewards[s_nodeToOwner[msg.sender]]
                    .baseToken += baseToken;
                s_totalNodeRewards[s_nodeToOwner[msg.sender]].token += token;
                baseTokenReward += baseToken;

                _addStake(s_nodeToOwner[msg.sender], baseToken, token);
            } else {
                // Deduct fees from stake balances
                if (
                    baseTokenFee > s_stakes[s_nodeToOwner[msg.sender]].baseToken
                ) {
                    baseTokenFee = s_stakes[s_nodeToOwner[msg.sender]]
                        .baseToken;
                }

                if (tokenFee > s_stakes[s_nodeToOwner[msg.sender]].token) {
                    tokenFee = s_stakes[s_nodeToOwner[msg.sender]].token;
                }

                s_totalDeductedStakes[s_nodeToOwner[msg.sender]]
                    .baseToken += baseTokenFee;
                s_totalDeductedStakes[s_nodeToOwner[msg.sender]]
                    .token += tokenFee;
                s_totalPendingStakingRewards.baseToken += baseTokenFee;
                s_totalPendingStakingRewards.token += tokenFee;

                _subStake(s_nodeToOwner[msg.sender], baseTokenFee, tokenFee);
            }
        }

        if (
            s_nodeAllowances[s_nodeToOwner[msg.sender]] > 0 &&
            baseTokenReward > 0
        ) {
            uint256 nodeShare = _calculateShare(
                s_nodeAllowances[s_nodeToOwner[msg.sender]] * 100,
                baseTokenReward
            );

            // deduct to total stake
            _subStake(s_nodeToOwner[msg.sender], nodeShare, 0);

            _transferBaseToken(msg.sender, nodeShare);
        }
        delete s_pendingRewardJobIds[s_nodeToOwner[msg.sender]];
        for (uint i = 0; i < pendingJobIds.length; i++) {
            s_pendingRewardJobIds[s_nodeToOwner[msg.sender]].push(
                pendingJobIds[i]
            );
        }
    }

    function getTotalRewards()
        external
        view
        override
        returns (uint256, uint256)
    {
        return (
            s_totalNodeRewards[s_nodeToOwner[msg.sender]].baseToken,
            s_totalNodeRewards[s_nodeToOwner[msg.sender]].token
        );
    }

    function getOwner(address node) external view override returns (address) {
        return s_nodeToOwner[node];
    }

    function getNode(address owner) external view override returns (address) {
        return s_ownerToNode[owner];
    }

    function getPendingRewardJobIds(address node)
        external
        view
        override
        returns (uint256[] memory)
    {
        return s_pendingRewardJobIds[s_nodeToOwner[node]];
    }

    function getNodeAllowance(address node)
        external
        view
        override
        returns (uint256)
    {
        return s_nodeAllowances[s_nodeToOwner[node]];
    }

    function isJobReady(uint256 jobId) external view override returns (bool) {
        JobRequest storage request = _getJobRequest(jobId);
        return
            request.validators.length >= request.minValidator &&
            block.timestamp < request.jobFulfillmentExpiration;
    }

    function isResponseSubmitted(uint256 jobId)
        external
        view
        override
        returns (bool)
    {
        return s_nodeDataId[jobId][s_nodeToOwner[msg.sender]] != 0;
    }

    function isNodeRegistered(address node)
        external
        view
        override
        returns (bool)
    {
        return _hasEnoughStakes(s_nodeToOwner[node]);
    }

    function _hasEnoughStakes(address operator) internal view returns (bool) {
        return
            s_stakes[operator].baseToken >= s_minStake.baseToken &&
            s_stakes[operator].token >= s_minStake.token;
    }

    function _filterPendingJobs(uint256[] memory jobIds) internal {
        delete s_operatorPendingRewardJobIds[s_nodeToOwner[msg.sender]]
            .finalized;
        delete s_operatorPendingRewardJobIds[s_nodeToOwner[msg.sender]].pending;

        for (uint i = 0; i < jobIds.length; i++) {
            JobRequest storage request = _getJobRequest(jobIds[i]);

            // Skip refunded jobs
            if (request.status == RequestStatus.Refunded) continue;

            if (request.status == RequestStatus.Pending) {
                s_operatorPendingRewardJobIds[s_nodeToOwner[msg.sender]]
                    .pending
                    .push(jobIds[i]);
            } else {
                s_operatorPendingRewardJobIds[s_nodeToOwner[msg.sender]]
                    .finalized
                    .push(jobIds[i]);
            }
        }
    }

    function _isDistributorNode(address node) internal view returns (bool) {
        uint256 randomNumber = s_distributorRandomNumber % 100;
        uint256 randomNumberWeight = randomNumber * 100;

        uint256 weight = _calculateWeight(
            s_stakes[s_nodeToOwner[node]].token,
            s_totalStakes.token
        );

        return randomNumberWeight <= weight;
    }

    function _distributeStakingRewards() internal virtual override {
        uint256 distributorbaseTokenShare = _calculateShare(
            10 * 100,
            s_totalPendingStakingRewards.baseToken
        );
        uint256 distributorTokenShare = _calculateShare(
            10 * 100,
            s_totalPendingStakingRewards.token
        );
        uint256 stakerbaseTokenShare = s_totalPendingStakingRewards.baseToken -
            distributorbaseTokenShare;
        uint256 stakerTokenShare = s_totalPendingStakingRewards.token -
            distributorTokenShare;

        s_totalPendingStakingRewards.baseToken = 0;
        s_totalPendingStakingRewards.token = 0;

        s_totalStakingRewards[s_nodeToOwner[msg.sender]]
            .baseToken += distributorbaseTokenShare;
        s_totalStakingRewards[s_nodeToOwner[msg.sender]]
            .token += distributorTokenShare;

        _addStake(
            s_nodeToOwner[msg.sender],
            stakerbaseTokenShare,
            distributorTokenShare
        );

        for (uint i = 0; i < s_stakers.length; i++) {
            uint256 weight = _calculateWeight(
                s_stakes[s_stakers[i]].token,
                s_totalStakes.token
            );
            uint256 baseTokenShare = _calculateShare(
                weight,
                stakerbaseTokenShare
            );
            uint256 tokenShare = _calculateShare(weight, stakerTokenShare);
            s_totalStakingRewards[s_stakers[i]].baseToken += baseTokenShare;
            s_totalStakingRewards[s_stakers[i]].token += tokenShare;
            _addStake(s_stakers[i], baseTokenShare, tokenShare);
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

    function _aggregateIdleJob(uint256 jobId, address aggregator)
        internal
        virtual;

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
}
