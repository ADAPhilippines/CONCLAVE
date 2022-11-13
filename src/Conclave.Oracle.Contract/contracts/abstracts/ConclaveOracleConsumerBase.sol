// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/IConclaveOracleConsumer.sol";
import "../interfaces/IConclaveOracle.sol";

abstract contract ConclaveOracleConsumerBase is IConclaveOracleConsumer {
    IConclaveOracle private immutable _conclaveOracle;

    modifier onlyConclaveOracle() {
        require(
            msg.sender == address(_conclaveOracle),
            "ConclaveOracleConsumerBase: only conclave oracle can call this function"
        );
        _;
    }

    constructor(address _oracle) {
        _conclaveOracle = IConclaveOracle(_oracle);
    }

    function requestRandomNumber(
        uint256 numCount,
        uint256 fee,
        uint256 tokenFee
    ) external onlyConclaveOracle {}

    function refundRequest(uint256 jobId)
        external
        override
        onlyConclaveOracle
    {}

    function getResponseCount(uint256 jobId)
        external
        view
        returns (uint256 currentResponses, uint256 totalResponses)
    {}

    function aggregateResponses(uint256 jobId) external {}
}
