using System.Numerics;
using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts;

namespace Conclave.Oracle.Node.Contracts.Definition.EventOutputs;

[Event("JobRequestCreated")]
public class JobRequestCreatedEventDTO : IEventDTO
{
    [Parameter("uint256", "jobId", 1, false)]
    public BigInteger JobId { get; set; }

    [Parameter("uint32", "numCount", 2, true)]
    public UInt32 NumCount { get; set; }
    
    [Parameter("uint256", "timestamp", 3, true)]
    public BigInteger Timestamp { get; set; }
}