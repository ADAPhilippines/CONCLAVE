using System.Numerics;
using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts;

namespace Conclave.Oracle.Node.Contracts.Definition;

[Event("JobAccepted")]
public class JobAcceptedEventDTOBase : IEventDTO
{
    [Parameter("uint256", "jobId", 1, true)]
    public BigInteger JobId { get; set; }

    [Parameter("address", "node", 2, true)]
    public string NodeAddress { get; set; } = string.Empty;
    
    [Parameter("uint256", "jobAcceptanceExpiration", 3, false)]
    public BigInteger JobAcceptanceExpiration { get; set; }
}

[Event("JobRequestCreated")]
public class JobRequestCreatedEventDTOBase : IEventDTO
{
    [Parameter("uint256", "jobId", 1, false)]
    public BigInteger JobId { get; set; }

    [Parameter("uint32", "numCount", 2, true)]
    public UInt32 NumCount { get; set; }
    
    [Parameter("uint256", "timestamp", 3, true)]
    public BigInteger Timestamp { get; set; }
}

[Event("JobRequestFulfilled")]
public class JobRequestFulfilledEventDTOBase : IEventDTO
{
    [Parameter("uint256", "jobId", 1, false)]
    public BigInteger JobId { get; set; }

    [Parameter("address", "requester", 2, true)]
    public string Requester { get; set; } = string.Empty;
    
    [Parameter("uint256", "timestamp", 3, true)]
    public BigInteger Timestamp { get; set; }
}

[Event("JobRequestRefunded")]
public class JobRequestRefundedEventDTOBase : IEventDTO
{
    [Parameter("uint256", "jobId", 1, false)]
    public BigInteger JobId { get; set; }

    [Parameter("address", "requester", 2, true)]
    public string Requester { get; set; } = string.Empty;
    
    [Parameter("uint256", "timestamp", 3, true)]
    public BigInteger Timestamp { get; set; }
}

[Event("NodeRegistered")]
public class NodeRegisteredEventDTOBase : IEventDTO
{
    [Parameter("address", "node", 1, true)]
    public string NodeAddress { get; set; } = string.Empty;
    
    [Parameter("address", "owner", 2, true)]
    public string OwnerAddress { get; set; } = string.Empty;
}

[FunctionOutput]
public class GetJobDetailsOutputDTOBase : IFunctionOutputDTO 
{
    [Parameter("tuple", "", 1)]
    public virtual JobRequest ReturnValue1 { get; set; } = new();
}

[FunctionOutput]
public class GetPendingJobIdsOutputDTOBase : IFunctionOutputDTO
{
    [Parameter("uint256[]", null, 1)]
    public List<BigInteger> JobIds { get; set; } = new List<BigInteger>();
}

[FunctionOutput]
public class GetPendingRewardJobIdsOutputDTOBase : IFunctionOutputDTO
{
    [Parameter("uint256[]", null, 1)]
    public List<BigInteger> JobIds { get; set; } = new List<BigInteger>();
}

[FunctionOutput]
public class GetTotalRewardsOutputDTOBase : IFunctionOutputDTO
{
    [Parameter("uint256", 1)]
    public BigInteger ADAReward { get; set; }

    [Parameter("uint256", 2)]
    public BigInteger CNCLVReward { get; set; }
}

[Function("getJobDetails", typeof(GetJobDetailsOutputDTOBase))]
public class GetJobDetailsFunctionBase : FunctionMessage
{
    [Parameter("uint256", "jobId", 1)]
    public virtual BigInteger JobId { get; set; }
}

public class JobRequestBase
{
    [Parameter("uint256", "jobId", 1)]
    public virtual BigInteger JobId { get; set; }

    [Parameter("uint256", "baseBaseTokenFee", 2)]
    public virtual BigInteger BaseBaseTokenFee { get; set; }

    [Parameter("uint256", "baseTokenFee", 3)]
    public virtual BigInteger BaseTokenFee { get; set; }

    [Parameter("uint256", "baseTokenFeePerNum", 4)]
    public virtual BigInteger BaseTokenFeePerNum { get; set; }

    [Parameter("uint256", "tokenFeePerNum", 5)]
    public virtual BigInteger TokenFeePerNum { get; set; }

    [Parameter("uint256", "timestamp", 6)]
    public virtual BigInteger Timestamp { get; set; }

    [Parameter("uint256", "seed", 7)]
    public virtual BigInteger Seed { get; set; }

    [Parameter("uint256", "jobAcceptanceExpiration", 8)]
    public virtual BigInteger JobAcceptanceExpiration { get; set; }

    [Parameter("uint256", "jobFulfillmentExpiration", 9)]
    public virtual BigInteger JobFulfillmentExpiration { get; set; }

    [Parameter("uint256", "jobExpiration", 10)]
    public virtual BigInteger JobExpiration { get; set; }

    [Parameter("uint256", "finalResultDataId", 11)]
    public virtual BigInteger FinalResultDataId { get; set; }

    [Parameter("uint24", "responseCount", 12)]
    public virtual uint ResponseCount { get; set; }

    [Parameter("uint24", "numCount", 13)]
    public virtual uint NumCount { get; set; }

    [Parameter("uint24", "minValidator", 14)]
    public virtual uint MinValidator { get; set; }

    [Parameter("uint24", "maxValidator", 15)]
    public virtual uint MaxValidator { get; set; }

    [Parameter("address", "requester", 16)]
    public virtual string Requester { get; set; } = string.Empty;

    [Parameter("address", "aggregator", 17)]
    public virtual string Aggregator { get; set; } = string.Empty;

    [Parameter("address[]", "validators", 18)]
    public virtual List<string> Validators { get; set; } = new();

    [Parameter("uint256[]", "dataIds", 19)]
    public virtual List<BigInteger> DataIds { get; set; } = new();

    [Parameter("uint256[]", "results", 20)]
    public virtual List<BigInteger> Results { get; set; } = new();
    
    [Parameter("uint8", "status", 21)]
    public virtual byte Status { get; set; }
}