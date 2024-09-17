// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IConclaveOracle} from "./interfaces/IConclaveOracle.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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

    IERC20 public immutable s_token;
    IConclaveOracle s_oracle;
    mapping(uint256 => Request) public s_results;

    Request[] public s_requests;

    constructor(address oracle, address token) {
        s_oracle = IConclaveOracle(oracle);
        s_token = IERC20(token);
    }

    function requestRandomNumbers(
        uint24 numCount,
        uint256 baseTokenFee,
        uint256 baseTokenFeePerNum,
        uint256 tokenFee,
        uint256 tokenFeePerNum,
        uint24 minValidators,
        uint24 maxValidators
    ) external payable {
        uint256 totalTokenFee = tokenFee + (tokenFeePerNum * numCount);
        s_token.transferFrom(msg.sender, address(this), totalTokenFee);
        uint256 jobId = s_oracle.requestRandomNumbers{value: msg.value}(
            numCount,
            baseTokenFee,
            baseTokenFeePerNum,
            tokenFee,
            tokenFeePerNum,
            minValidators,
            maxValidators
        );

        s_results[jobId].jobId = jobId;
        s_results[jobId].status = RequestStatus.Pending;
        s_requests.push(s_results[jobId]);
    }

    function finalizeResult(uint256 jobId) external {
        if (s_results[jobId].jobId == 0) {
            revert("Job ID does not exist");
        }

        (uint256[] memory result, uint status) = s_oracle.aggregateResult(
            jobId
        );

        for (uint i = 0; i < result.length; i++) {
            s_results[jobId].result.push(result[i]);
        }

        s_results[jobId].status = RequestStatus(status);

        if (status == uint(RequestStatus.Refunded)) {
            // refund logic
        } else {
            // draw logic
        }
    }

    function approve() external {
        s_token.approve(address(s_oracle), 2**256 - 1);
    }

    receive() external payable {}

    function getResults(uint256 jobId) public view returns (Request memory r) {
        r = s_results[jobId];
    }
}
