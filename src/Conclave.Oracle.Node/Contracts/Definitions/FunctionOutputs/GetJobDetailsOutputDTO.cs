using System.Numerics;
using Nethereum.ABI.FunctionEncoding.Attributes;

namespace Conclave.Oracle.Node.Contracts.Definition.FunctionOutputs;
public enum RequestStatus
{
    Pending,
    Refunded,
    Fulfilled
}

[FunctionOutput]
public class GetJobDetailsOutputDTO : IFunctionOutputDTO
{
    [Parameter("uint256", "jobId", 1)]
    public BigInteger JobId { get; set; }

    [Parameter("uint256", "baseBaseTokenFee", 2)]
    public BigInteger BaseBaseTokenFee { get; set; }

    [Parameter("uint256", "baseTokenFee", 3)]
    public BigInteger BaseTokenFee { get; set; }

    [Parameter("uint256", "baseTokenFeePerNum", 4)]
    public BigInteger BaseTokenFeePerNum { get; set; }

    [Parameter("uint256", "tokenFeePerNum", 5)]
    public BigInteger TokenFeePerNum { get; set; }

    [Parameter("uint256", "timestamp", 6)]
    public BigInteger Timestamp { get; set; }

    [Parameter("uint256", "jobAcceptanceExpiration", 7)]
    public BigInteger JobAcceptanceExpiration { get; set; }

    [Parameter("uint256", "jobFulfillmentExpiration", 8)]
    public BigInteger JobFulfillmentExpiration { get; set; }

    [Parameter("uint256", "finalResultDataId", 9)]
    public BigInteger FinalResultDataId { get; set; }

    [Parameter("uint256", "responseCount", 10)]
    public BigInteger ResponseCount { get; set; }

    [Parameter("uint24", "numCount", 11)]
    public UInt32 NumCount { get; set; }
    [Parameter("uint24", "minValidator", 12)]
    public UInt32 MinValidator { get; set; }
    [Parameter("uint24", "maxValidator", 13)]
    public UInt32 MaxValidator { get; set; }

    [Parameter("address", "requester", 14)]
    public string Requester { get; set; } = string.Empty;

    [Parameter("address[]", "validators", 15)]
    public List<string> Validators { get; set; } = new();

    [Parameter("uint256[]", "dataIds", 16)]
    public List<BigInteger> DataIds { get; set; } = new();

    [Parameter("uint8", "status", 17)]
    public RequestStatus Status { get; set; }
}
