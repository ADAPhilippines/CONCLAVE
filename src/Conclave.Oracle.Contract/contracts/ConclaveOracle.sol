// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./abstracts/ConclaveOracleOperator.sol";
import "./interfaces/IConclaveOracle.sol";
import "./interfaces/IConclaveOracleConsumer.sol";

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

    event JobRequestCreated(uint256 jobId, uint32 indexed numCount);

    mapping(uint256 => JobRequest) /* jobId => jobRequest */
        private s_jobRequests;

    constructor(
        IERC20 token,
        uint256 minValidatorStake,
        uint256 jobAcceptanceTimeLimitInSeconds,
        uint256 jobFulfillmentLimitPerNumberInSeconds,
        uint256 slashingAmount,
        uint256 minAdaStakingRewards,
        uint256 minTokenStakingRewards
    )
        ConclaveOracleOperator(
            token,
            minValidatorStake,
            slashingAmount,
            minAdaStakingRewards,
            minTokenStakingRewards
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

        uint256 jobFulfillmentLimit = block.timestamp +
            jobAcceptanceTimeLimit +
            (s_jobFulfillmentLimitPerNumberInSeconds * numCount);

        JobRequest storage jobRequest = s_jobRequests[jobId];
        jobRequest.jobId = jobId;
        jobRequest.baseAdaFee = fee;
        jobRequest.adaFeePerNum = feePerNum;
        jobRequest.baseTokenFee = tokenFee;
        jobRequest.tokenFeePerNum = tokenFeePerNum;
        jobRequest.timestamp = block.timestamp;
        jobRequest.jobAcceptanceExpiration = jobAcceptanceTimeLimit;
        jobRequest.jobFulfillmentExpiration = jobFulfillmentLimit;
        jobRequest.requester = msg.sender;
        jobRequest.numCount = numCount;

        nonce++;

        emit JobRequestCreated(jobId, numCount);
    }

    function aggregateResult(uint256 jobId)
        external
        payable
        override
        onlyExistingRequest(jobId)
        onlyWithinTimeLimit(_getJobRequest(jobId).jobFulfillmentExpiration)
        returns (uint256[] memory randomNumbers)
    {
        JobRequest storage jobRequest = s_jobRequests[jobId];

        if (msg.sender != jobRequest.requester) {
            revert NotAuthorized();
        }

        if (jobRequest.minValidator < jobRequest.responseCount) {
            _refundFees(jobId);
        } else {
            uint256 finalDataId;
            uint32 maxResponses;

            for (uint256 i = 0; i < jobRequest.dataIds.length; i++) {
                if (
                    jobRequest.dataIdVotes[jobRequest.dataIds[i]] > maxResponses
                ) {
                    maxResponses = jobRequest.dataIdVotes[
                        jobRequest.dataIds[i]
                    ];
                    finalDataId = jobRequest.dataIds[i];
                }
            }

            // finalize request properties
            jobRequest.finalResultDataId = finalDataId;
            jobRequest.isFulfilled = true;
            randomNumbers = _getRandomNumbers(finalDataId);
            s_totalFulfilled++;

            s_feesCollected += _calculateShare(
                10 * 100,
                (jobRequest.baseAdaFee +
                    (jobRequest.adaFeePerNum * jobRequest.numCount))
            );
            s_tokenFeesCollected += _calculateShare(
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
            return randomNumbers;
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
        IConclaveOracleConsumer(jobRequest.requester).refundRequest(jobId);
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
