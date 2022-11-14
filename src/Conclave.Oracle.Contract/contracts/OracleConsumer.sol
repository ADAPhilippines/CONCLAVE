// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IConclaveOracle} from "./interfaces/IConclaveOracle.sol";

contract OracleConsumer {
    enum RequestStatus {
        Pending,
        Refunded,
        Fulfilled
    }

    struct Request {
        uint256 jobId;
        uint256[] result;
        RequestStatus status;
    }

    IConclaveOracle s_oracle;
    mapping(uint256 => Request) public s_results;

    constructor(address _oracle) {
        s_oracle = IConclaveOracle(_oracle);
    }

    function requestRandomNumbers(
        uint24 numCount,
        uint256 adaFee,
        uint256 adaFeePerNum,
        uint256 tokenFee,
        uint256 tokenFeePerNum,
        uint24 minValidator,
        uint24 maxValidator
    ) external {
        uint256 jobId = s_oracle.requestRandomNumbers(
            numCount,
            adaFee,
            adaFeePerNum,
            tokenFee,
            tokenFeePerNum,
            minValidator,
            maxValidator
        );

        s_results[jobId].jobId = jobId;
        s_results[jobId].status = RequestStatus.Pending;
    }

    function finalizeResult(uint256 jobId) external {
        if (s_results[jobId].jobId == 0) {
            revert("Job ID does not exist");
        }

        (uint256[] memory result, uint status) = s_oracle.aggregateResult(
            jobId
        );

        s_results[jobId].result = result;
        s_results[jobId].status = RequestStatus(status);

        if (status == uint(RequestStatus.Refunded)) {
            // refund logic
        } else {
            // draw logic
        }
    }
}
