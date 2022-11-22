// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./abstracts/ConclaveOracleOperator.sol";
import "./interfaces/IConclaveOracle.sol";
import "hardhat/console.sol";

contract ConclaveOracle is IConclaveOracle, ConclaveOracleOperator {
    uint32 s_minNumCount = 1;
    uint32 s_maxNumCount = 500;
    uint256 s_jobAcceptanceTimeLimitInSeconds;
    uint256 s_jobFulfillmentLimitPerNumberInSeconds;
    uint256 s_baseTokenFeeAverage;
    uint256 s_baseTokenFeePerNumAverage;
    uint256 s_tokenFeeAverage;
    uint256 s_tokenFeePerNumAverage;
    uint256 s_requestCount;
    uint256 s_totalFulfilled;

    error ValueMismatch(uint256 stated, uint256 actual);
    error NumberCountNotInRange(uint256 min, uint256 max, uint256 actual);
    error NotAuthorized();
    error InvalidValidatorRange();
    error JobSubmissionInProgress();
    error JobAlreadyFinalized();
    error JobAcceptanceInProgress();

    event JobRequestCreated(
        uint256 jobId,
        uint32 indexed numCount,
        uint256 indexed timestamp
    );

    event JobRequestRefunded(
        uint256 jobId,
        address indexed requester,
        uint256 indexed timestamp
    );

    event JobRequestFulfilled(
        uint256 jobId,
        address indexed requester,
        uint256 indexed timestamp
    );

    event OracleFeesUpdated(
        uint256 baseTokenFeeAverage,
        uint256 baseTokenFeePerNumAverage,
        uint256 tokenFeeAverage,
        uint256 tokenFeePerNumAverage
    );

    mapping(uint256 => JobRequest) /* jobId => jobRequest */
        private s_jobRequests;

    constructor(
        IERC20 token,
        uint256 minBaseTokenStake,
        uint256 minTokenStake,
        uint256 minBaseStakingRewards,
        uint256 minTokenStakingRewards,
        uint256 jobAcceptanceTimeLimitInSeconds,
        uint256 jobFulfillmentLimitPerNumberInSeconds
    )
        ConclaveOracleOperator(
            token,
            minBaseStakingRewards,
            minTokenStakingRewards,
            minBaseTokenStake,
            minTokenStake
        )
    {
        s_jobAcceptanceTimeLimitInSeconds = jobAcceptanceTimeLimitInSeconds;
        s_jobFulfillmentLimitPerNumberInSeconds = jobFulfillmentLimitPerNumberInSeconds;
    }

    receive() external payable {}

    function balance()
        external
        view
        override
        returns (uint256 baseToken, uint256 token)
    {
        return (address(this).balance, _token.balanceOf(address(this)));
    }

    function requestRandomNumbers(
        uint24 numCount,
        uint256 fee,
        uint256 feePerNum,
        uint256 tokenFee,
        uint256 tokenFeePerNum,
        uint24 minValidator,
        uint24 maxValidator
    ) external payable returns (uint256 jobId) {
        uint256 totalFee = fee + (numCount * feePerNum);
        uint256 totalTokenFee = tokenFee + (numCount * tokenFeePerNum);

        if (msg.value != totalFee) {
            revert ValueMismatch(msg.value, totalFee);
        }

        if (minValidator < 1 || maxValidator < minValidator) {
            revert InvalidValidatorRange();
        }

        if (numCount < s_minNumCount || numCount > s_maxNumCount) {
            revert NumberCountNotInRange(
                s_minNumCount,
                s_maxNumCount,
                numCount
            );
        }

        _token.transferFrom(msg.sender, address(this), totalTokenFee);
        jobId = _getJobId(
            msg.sender,
            numCount,
            block.timestamp,
            s_requestCount,
            block.number
        );

        uint256 jobAcceptanceTimeLimit = block.timestamp +
            s_jobAcceptanceTimeLimitInSeconds;

        uint256 jobFulfillmentLimit = jobAcceptanceTimeLimit +
            (s_jobFulfillmentLimitPerNumberInSeconds * numCount);

        JobRequest storage jobRequest = s_jobRequests[jobId];
        jobRequest.jobId = jobId;
        jobRequest.baseTokenFee = baseTokenFee;
        jobRequest.baseTokenFeePerNum = baseTokenFeePerNum;
        jobRequest.tokenFee = tokenFee;
        jobRequest.tokenFeePerNum = tokenFeePerNum;
        jobRequest.timestamp = block.timestamp;
        jobRequest.seed = block.timestamp;
        jobRequest.maxValidator = maxValidator;
        jobRequest.minValidator = minValidator;
        jobRequest.jobAcceptanceExpiration = jobAcceptanceTimeLimit;
        jobRequest.jobFulfillmentExpiration = jobFulfillmentLimit;
        jobRequest.jobExpiration = jobFulfillmentLimit + 1 hours;
        jobRequest.requester = msg.sender;
        jobRequest.numCount = numCount;

        s_requestCount++;

        emit JobRequestCreated(jobId, numCount, block.timestamp);
    }

    function aggregateResult(uint256 jobId)
        public
        payable
        override
        onlyExistingRequest(jobId)
        returns (uint256[] memory randomNumbers, uint status)
    {
        JobRequest storage jobRequest = s_jobRequests[jobId];

        if (
            block.timestamp < jobRequest.jobAcceptanceExpiration &&
            jobRequest.validators.length < jobRequest.maxValidator
        ) {
            revert JobAcceptanceInProgress();
        }

        if (
            jobRequest.validators.length < jobRequest.responseCount &&
            block.timestamp < jobRequest.jobFulfillmentExpiration
        ) {
            revert JobSubmissionInProgress();
        }

        if (
            msg.sender != jobRequest.requester &&
            msg.sender != jobRequest.aggregator
        ) {
            revert NotAuthorized();
        }

        if (jobRequest.status != RequestStatus.Pending) {
            revert JobAlreadyFinalized();
        }

        if (jobRequest.minValidator > jobRequest.responseCount) {
            _refundFees(jobId);
            randomNumbers = new uint256[](jobRequest.numCount);
            status = uint(RequestStatus.Refunded);
            jobRequest.status = RequestStatus.Refunded;

            emit JobRequestRefunded(
                jobId,
                jobRequest.requester,
                block.timestamp
            );
        } else {
            uint256 finalDataId;
            uint32 maxResponses;

            for (uint256 i = 0; i < jobRequest.dataIds.length; i++) {
                if (
                    s_dataIdVotes[jobId][jobRequest.dataIds[i]] > maxResponses
                ) {
                    maxResponses = s_dataIdVotes[jobId][jobRequest.dataIds[i]];
                    finalDataId = jobRequest.dataIds[i];
                }
            }

            // finalize request properties
            jobRequest.finalResultDataId = finalDataId;
            jobRequest.status = RequestStatus.Fulfilled;
            randomNumbers = _getRandomNumbers(finalDataId);

            for (uint256 i = 0; i < randomNumbers.length; i++) {
                jobRequest.results.push(randomNumbers[i]);
            }

            status = uint(RequestStatus.Fulfilled);
            s_totalFulfilled++;

            s_totalPendingStakingRewards.baseToken += _calculateShare(
                10 * 100,
                (jobRequest.baseBaseTokenFee +
                    (jobRequest.baseTokenFeePerNum * jobRequest.numCount))
            );
            s_totalPendingStakingRewards.token += _calculateShare(
                10 * 100,
                (jobRequest.tokenFee +
                    (jobRequest.tokenFeePerNum * jobRequest.numCount))
            );

            // update oracle fees
            _calculateOracleFees(
                jobRequest.baseBaseTokenFee,
                jobRequest.baseTokenFeePerNum,
                jobRequest.baseTokenFee,
                jobRequest.tokenFeePerNum
            );

            emit JobRequestFulfilled(
                jobId,
                jobRequest.requester,
                block.timestamp
            );

            emit OracleFeesUpdated(
                s_baseTokenFeeAverage,
                s_baseTokenFeePerNumAverage,
                s_tokenFeeAverage,
                s_tokenFeePerNumAverage
            );
        }
    }

    function getAverageOracleFees()
        external
        view
        override
        returns (
            uint256 baseToken,
            uint256 baseTokenFeePerNum,
            uint256 token,
            uint256 tokenFeePerNum
        )
    {
        baseToken = s_baseTokenFeeAverage;
        baseTokenFeePerNum = s_baseTokenFeePerNumAverage;
        token = s_tokenFeeAverage;
        tokenFeePerNum = s_tokenFeePerNumAverage;
    }

    function _calculateOracleFees(
        uint256 fee,
        uint256 feePerNum,
        uint256 tokenFee,
        uint256 tokenFeePerNum
    ) internal {
        s_baseTokenFeeAverage = _calculateAverage(
            s_baseTokenFeeAverage,
            fee,
            s_totalFulfilled
        );

        s_baseTokenFeePerNumAverage = _calculateAverage(
            s_baseTokenFeePerNumAverage,
            feePerNum,
            s_totalFulfilled
        );

        s_tokenFeeAverage = _calculateAverage(
            s_tokenFeeAverage,
            tokenFee,
            s_totalFulfilled
        );

        s_tokenFeePerNumAverage = _calculateAverage(
            s_tokenFeePerNumAverage,
            tokenFeePerNum,
            s_totalFulfilled
        );
    }

    function _calculateAverage(
        uint256 previousAverage,
        uint256 newValue,
        uint256 totalCount
    ) internal pure returns (uint256) {
        if (totalCount == 1) {
            return newValue;
        }
        return (previousAverage * (totalCount - 1) + newValue) / totalCount;
    }

    function _refundFees(uint256 jobId) internal {
        JobRequest storage request = s_jobRequests[jobId];

        uint256 baseTokenRefund = request.baseBaseTokenFee +
            (request.numCount * request.baseTokenFeePerNum);

        uint256 tokenRefund = request.tokenFee +
            (request.numCount * request.tokenFeePerNum);

        if (request.validators.length > 0) {
            uint256 totalBaseTokenSlashed;
            uint256 totalTokenSlashed;
            // Slash stakes of validators who did not respond
            for (uint256 i = 0; i < request.validators.length; i++) {
                if (s_nodeDataId[jobId][request.validators[i]] != 0) continue;

                uint256 baseTokenDeduction = baseTokenRefund;
                uint256 tokenDeduction = tokenRefund;

                if (
                    baseTokenDeduction >
                    s_stakes[request.validators[i]].baseToken
                ) {
                    baseTokenDeduction = s_stakes[request.validators[i]]
                        .baseToken;
                }

                if (tokenDeduction > s_stakes[request.validators[i]].token) {
                    tokenDeduction = s_stakes[request.validators[i]].token;
                }

                totalBaseTokenSlashed += baseTokenDeduction;
                totalTokenSlashed += tokenDeduction;

                _subStake(
                    request.validators[i],
                    baseTokenDeduction,
                    tokenDeduction
                );

                s_totalDeductedStakes[request.validators[i]]
                    .baseToken += baseTokenDeduction;
                s_totalDeductedStakes[request.validators[i]]
                    .token += tokenDeduction;
            }

            uint256 weight = _calculateWeight(1, request.responseCount);
            uint256 baseTokenRewardPerValidator = _calculateShare(
                weight,
                baseTokenRefund
            );
            uint256 tokenRewardPerValidator = _calculateShare(
                weight,
                tokenRefund
            );

            // Reward validators who responded
            for (uint i = 0; i < request.validators.length; i++) {
                if (s_nodeDataId[jobId][request.validators[i]] == 0) continue;
                s_totalNodeRewards[request.validators[i]]
                    .baseToken += baseTokenRewardPerValidator;
                s_totalNodeRewards[request.validators[i]]
                    .token += tokenRewardPerValidator;
                _addStake(
                    request.validators[i],
                    baseTokenRewardPerValidator,
                    tokenRewardPerValidator
                );
            }

            totalBaseTokenSlashed -= baseTokenRefund;
            totalTokenSlashed -= tokenRefund;

            if (totalBaseTokenSlashed > 0) {
                uint256 requesterShare = _calculateShare(
                    10 * 100,
                    totalBaseTokenSlashed
                );
                uint256 stakingRewardsShare = totalBaseTokenSlashed -
                    requesterShare;

                s_totalPendingStakingRewards.baseToken += stakingRewardsShare;
                baseTokenRefund += requesterShare;
            }

            if (totalTokenSlashed > 0) {
                uint256 requesterShare = _calculateShare(
                    10 * 100,
                    totalTokenSlashed
                );

                uint256 stakingRewardsShare = totalTokenSlashed -
                    requesterShare;

                s_totalPendingStakingRewards.token += stakingRewardsShare;
                tokenRefund += requesterShare;
            }
        }

        _token.transfer(request.requester, tokenRefund);
        _transferBaseToken(request.requester, baseTokenRefund);
    }

    function _getJobId(
        address requester,
        uint256 numCount,
        uint256 timestamp,
        uint256 requestCount,
        uint256 blockNumber
    ) internal pure returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        requester,
                        numCount,
                        timestamp,
                        requestCount,
                        blockNumber
                    )
                )
            );
    }

    function _getJobRequest(uint256 jobId)
        internal
        view
        virtual
        override
        returns (JobRequest storage)
    {
        return s_jobRequests[jobId];
    }

    function getPendingJobIds()
        external
        view
        override
        returns (uint256[] memory)
    {
        return s_pendingJobRequestIds;
    }

    function getNodeCount() external view override returns (uint256 counter) {
        for (uint256 i = 0; i < s_stakers.length; i++) {
            if (
                s_stakes[s_stakers[i]].baseToken > s_minStake.baseToken &&
                s_stakes[s_stakers[i]].token > s_minStake.token
            ) {
                counter++;
            }
        }
    }

    function _aggregateIdleJob(uint256 jobId, address aggregator)
        internal
        virtual
        override
    {
        JobRequest storage request = s_jobRequests[jobId];

        if (
            request.status != RequestStatus.Pending &&
            block.timestamp < request.jobExpiration
        ) return;

        if (request.responseCount < request.minValidator) return;

        request.aggregator = aggregator;

        aggregateResult(jobId);
    }
}
