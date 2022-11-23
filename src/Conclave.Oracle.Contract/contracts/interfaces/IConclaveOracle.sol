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
        returns (uint256[] memory, uint status);

    function getAverageOracleFees()
        external
        view
        returns (
            uint256,
            uint256,
            uint256,
            uint256
        );

    function getPendingJobIds() external view returns (uint256[] memory);

<<<<<<< HEAD
    function balance() external view returns (uint256 ada, uint256 token);
=======
    function getNodeCount() external view returns (uint256);

    function balance() external view returns (uint256 baseToken, uint256 token);
>>>>>>> 2655d87e0458e6afd2ae8fd3db3a636a2fbab066
}
