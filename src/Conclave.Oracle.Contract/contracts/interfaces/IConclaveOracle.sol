// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IConclaveOracle {
    function requestRandomNumbers(
        uint24 numCount,
        uint256 fee,
        uint256 feePerNum,
        uint256 tokenFee,
        uint256 tokenFeePerNum,
        uint24 minValidator,
        uint24 maxValidator
    ) external payable returns (uint256 jobId);

    function aggregateResult(uint256 jobId)
        external
        payable
        returns (uint256[] memory);

    function getAverageOracleFees()
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        );
}
