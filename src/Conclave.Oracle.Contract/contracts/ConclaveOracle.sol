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
    uint256 s_adaFeeAverage;
    uint256 s_adaFeePerNumAverage;
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

    mapping(uint256 => JobRequest) /* jobId => jobRequest */
        private s_jobRequests;

    constructor(
        IERC20 token,
        uint256 minAdaStake,
        uint256 minTokenStake,
        uint256 minAdaStakingRewards,
        uint256 minTokenStakingRewards,
        uint256 jobAcceptanceTimeLimitInSeconds,
        uint256 jobFulfillmentLimitPerNumberInSeconds
    )
        ConclaveOracleOperator(
            token,
            minAdaStakingRewards,
            minTokenStakingRewards,
            minAdaStake,
            minTokenStake
        )
    {
        s_jobAcceptanceTimeLimitInSeconds = jobAcceptanceTimeLimitInSeconds;
        s_jobFulfillmentLimitPerNumberInSeconds = jobFulfillmentLimitPerNumberInSeconds;
    }

    receive() external payable {}

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
            s_requestCount + 1,
            block.number
        );

        uint256 jobAcceptanceTimeLimit = block.timestamp +
            s_jobAcceptanceTimeLimitInSeconds;

        uint256 jobFulfillmentLimit = jobAcceptanceTimeLimit +
            (s_jobFulfillmentLimitPerNumberInSeconds * numCount);

        JobRequest storage jobRequest = s_jobRequests[jobId];
        jobRequest.jobId = jobId;
        jobRequest.baseAdaFee = fee;
        jobRequest.adaFeePerNum = feePerNum;
        jobRequest.baseTokenFee = tokenFee;
        jobRequest.tokenFeePerNum = tokenFeePerNum;
        jobRequest.timestamp = block.timestamp;
        jobRequest.maxValidator = maxValidator;
        jobRequest.minValidator = minValidator;
        jobRequest.jobAcceptanceExpiration = jobAcceptanceTimeLimit;
        jobRequest.jobFulfillmentExpiration = jobFulfillmentLimit;
        jobRequest.requester = msg.sender;
        jobRequest.numCount = numCount;

        s_requestCount++;

        emit JobRequestCreated(jobId, numCount, block.timestamp);
    }

    function aggregateResult(uint256 jobId)
        external
        payable
        override
        onlyExistingRequest(jobId)
        returns (uint256[] memory randomNumbers, uint status)
    {
        JobRequest storage jobRequest = s_jobRequests[jobId];

        if (block.timestamp < jobRequest.jobAcceptanceExpiration) {
            revert JobAcceptanceInProgress();
        }

        if (
            jobRequest.validators.length < jobRequest.responseCount &&
            block.timestamp < jobRequest.jobFulfillmentExpiration
        ) {
            revert JobSubmissionInProgress();
        }

        if (msg.sender != jobRequest.requester) {
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
            status = uint(RequestStatus.Fulfilled);
            s_totalFulfilled++;

            s_totalPendingStakingRewards.ada += _calculateShare(
                10 * 100,
                (jobRequest.baseAdaFee +
                    (jobRequest.adaFeePerNum * jobRequest.numCount))
            );
            s_totalPendingStakingRewards.token += _calculateShare(
                10 * 100,
                (jobRequest.baseTokenFee +
                    (jobRequest.tokenFeePerNum * jobRequest.numCount))
            );

            // update oracle fees
            _calculateOracleFees(
                jobRequest.baseTokenFee,
                jobRequest.adaFeePerNum,
                jobRequest.baseTokenFee,
                jobRequest.tokenFeePerNum
            );
        }
    }

    function getAverageOracleFees()
        external
        view
        override
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        )
    {
        return (
            s_adaFeeAverage,
            s_adaFeePerNumAverage,
            s_tokenFeeAverage,
            s_tokenFeePerNumAverage
        );
    }

    function _calculateOracleFees(
        uint256 fee,
        uint256 feePerNum,
        uint256 tokenFee,
        uint256 tokenFeePerNum
    ) internal {
        s_adaFeeAverage = _calculateAverage(
            s_adaFeeAverage,
            fee,
            s_totalFulfilled
        );

        s_adaFeePerNumAverage = _calculateAverage(
            s_adaFeePerNumAverage,
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
        return (previousAverage * (totalCount - 1) + newValue) / totalCount;
    }

    function _refundFees(uint256 jobId) internal {
        JobRequest storage request = s_jobRequests[jobId];

        uint256 adaRefund = request.baseAdaFee +
            (request.numCount * request.adaFeePerNum);

        uint256 tokenRefund = request.baseTokenFee +
            (request.numCount * request.tokenFeePerNum);

        if (request.validators.length > 0) {
            uint256 totalAdaSlashed;
            uint256 totalTokenSlashed;
            // Slash stakes of validators who did not respond
            for (uint256 i = 0; i < request.validators.length; i++) {
                if (s_nodeDataId[jobId][request.validators[i]] != 0) continue;

                uint256 adaDeduction = adaRefund;
                uint256 tokenDeduction = tokenRefund;

                if (adaDeduction > s_stakes[request.validators[i]].ada) {
                    adaDeduction = s_stakes[request.validators[i]].ada;
                }

                if (tokenDeduction > s_stakes[request.validators[i]].token) {
                    tokenDeduction = s_stakes[request.validators[i]].token;
                }

                totalAdaSlashed += adaDeduction;
                totalTokenSlashed += tokenDeduction;

                _subStake(request.validators[i], adaDeduction, tokenDeduction);

                s_totalDeductedStakes[request.validators[i]]
                    .ada += adaDeduction;
                s_totalDeductedStakes[request.validators[i]]
                    .token += tokenDeduction;
            }

            uint256 weight = _calculateWeight(1, request.responseCount);
            uint256 adaRewardPerValidator = _calculateShare(weight, adaRefund);
            uint256 tokenRewardPerValidator = _calculateShare(
                weight,
                tokenRefund
            );

            // Reward validators who responded
            for (uint i = 0; i < request.validators.length; i++) {
                if (s_nodeDataId[jobId][request.validators[i]] == 0) continue;
                s_totalNodeRewards[request.validators[i]]
                    .ada += adaRewardPerValidator;
                s_totalNodeRewards[request.validators[i]]
                    .token += tokenRewardPerValidator;
                _addStake(
                    request.validators[i],
                    adaRewardPerValidator,
                    tokenRewardPerValidator
                );
            }

            totalAdaSlashed -= adaRefund;
            totalTokenSlashed -= tokenRefund;

            if (totalAdaSlashed > 0) {
                uint256 requesterShare = _calculateShare(
                    10 * 100,
                    totalAdaSlashed
                );
                uint256 stakingRewardsShare = totalAdaSlashed - requesterShare;

                s_totalPendingStakingRewards.ada += stakingRewardsShare;
                adaRefund += requesterShare;
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
        payable(request.requester).transfer(adaRefund);
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

    function balance() external view returns (uint256 ada, uint256 token) {
        return (address(this).balance, _token.balanceOf(address(this)));
    }
}
