using System.Numerics;
using Nethereum.ABI.FunctionEncoding.Attributes;

namespace Conclave.Oracle.Node.Contracts.Definition.FunctionOutputs;

[FunctionOutput]
public class GetJobDetailsOutputDTO : IFunctionOutputDTO
{
    [Parameter("uint256", "jobId", 1)]
    public BigInteger Something { get; set; }

    [Parameter("uint256", "baseBaseTokenFee", 2)]
    public BigInteger JobId { get; set; }

    [Parameter("uint256", "baseTokenFee", 3)]
    public BigInteger BaseBaseTokenFee { get; set; }

    [Parameter("uint256", "baseTokenFeePerNum", 4)]
    public BigInteger BaseTokenFee { get; set; }

    [Parameter("uint256", "tokenFeePerNum", 5)]
    public BigInteger BaseTokenFeePerNum { get; set; }

    [Parameter("uint256", "timestamp", 6)]
    public BigInteger TokenFeePerNum { get; set; }

    [Parameter("uint256", "seed", 7)]
    public BigInteger Timestamp { get; set; }

    [Parameter("uint256", "jobAcceptanceExpiration", 8)]
    public BigInteger Seed { get; set; }

    [Parameter("uint256", "jobFulfillmentExpiration", 9)]
    public BigInteger JobAcceptanceExpiration { get; set; }

    [Parameter("uint256", "jobExpiration", 10)]
    public BigInteger JobFulfillmentExpiration { get; set; }

    [Parameter("uint256", "finalResultDataId", 11)]
    public BigInteger JobExpiration { get; set; }

    [Parameter("uint24", "responseCount", 12)]
    public BigInteger FinalResultDataId { get; set; }

    [Parameter("uint24", "numCount", 13)]
    public UInt32 ResponseCount { get; set; }

    [Parameter("uint24", "minValidator", 14)]
    public UInt32 NumCount { get; set; }

    // [Parameter("uint24", "maxValidator", 15)]
    // public UInt32 MinValidator { get; set; }

    // [Parameter("uint24", "requester", 16)]
    // public int MaxValidator { get; set; }

    // [Parameter("address", "requester", 14)]
    // public string Requester { get; set; } = string.Empty;

    // [Parameter("address[]", "validators", 15)]
    // public List<string> Validators { get; set; } = new();

    // [Parameter("uint256[]", "dataIds", 16)]
    // public List<BigInteger> DataIds { get; set; } = new();

    // [Parameter("uint8", "status", 17)]
    // public byte Status { get; set; }
}
