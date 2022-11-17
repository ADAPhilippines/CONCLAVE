// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./abstracts/ConclaveOracleOperator.sol";
import "./interfaces/IConclaveOracle.sol";

contract ConclaveOracle is IConclaveOracle, ConclaveOracleOperator {
    uint32 s_minNumCount = 1;
    uint32 s_maxNumCount = 500;
    uint256 s_jobAcceptanceTimeLimitInSeconds;
    uint256 s_jobFulfillmentLimitPerNumberInSeconds;
    uint256 s_totalFulfilled;
    uint256 s_totalFee;
    uint256 s_totalFeeAverage;
    uint256 s_totalFeePerNum;
    uint256 s_totalFeePerNumAverage;
    uint256 s_totalTokenFee;
    uint256 s_totalTokenFeeAverage;
    uint256 s_totalTokenFeePerNum;
    uint256 s_totalTokenFeePerNumAverage;

    uint256 nonce;

    error ValueMismatch(uint256 stated, uint256 actual);
    error NumberCountNotInRange(uint256 min, uint256 max, uint256 actual);
    error NotAuthorized();
    error InvalidValidatorRange();
    error JobSubmissionInProgress();

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
        jobId = _getJobId(msg.sender, numCount, block.timestamp, nonce);

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

        nonce++;

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

        if (
            jobRequest.validators.length < jobRequest.responseCount &&
            block.timestamp < jobRequest.jobFulfillmentExpiration
        ) {
            revert JobSubmissionInProgress();
        }

        if (msg.sender != jobRequest.requester) {
            revert NotAuthorized();
        }

        if (jobRequest.minValidator < jobRequest.responseCount) {
            // @TODO: Should be able to aggregate if minValidator not met within jobAcceptance limit
            // REFUND 10% of slashed amount to consumer
            // PAY THE HONEST NODES

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
            s_totalFeeAverage,
            s_totalFeePerNumAverage,
            s_totalTokenFeeAverage,
            s_totalTokenFeePerNumAverage
        );
    }

    function _calculateOracleFees(
        uint256 fee,
        uint256 feePerNum,
        uint256 tokenFee,
        uint256 tokenFeePerNum
    ) internal {
        s_totalFee += fee;
        s_totalFeeAverage = s_totalFee / s_totalFulfilled;
        s_totalFeePerNum += feePerNum;
        s_totalFeePerNumAverage = s_totalFeePerNum / s_totalFulfilled;
        s_totalTokenFee += tokenFee;
        s_totalTokenFeeAverage = s_totalTokenFee / s_totalFulfilled;
        s_totalTokenFeePerNum += tokenFeePerNum;
        s_totalTokenFeePerNumAverage = s_totalTokenFeePerNum / s_totalFulfilled;
    }

    function _refundFees(uint256 jobId) internal {
        JobRequest storage jobRequest = s_jobRequests[jobId];

        uint256 totalFee = jobRequest.baseAdaFee +
            (jobRequest.numCount * jobRequest.adaFeePerNum);

        uint256 totalTokenFee = jobRequest.baseTokenFee +
            (jobRequest.numCount * jobRequest.tokenFeePerNum);

        _token.transfer(jobRequest.requester, totalTokenFee);
        payable(jobRequest.requester).transfer(totalFee);
    }

    function _getJobId(
        address requester,
        uint256 numCount,
        uint256 timestamp,
        uint256 _nonce
    ) internal pure returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(requester, numCount, timestamp, _nonce)
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
}
