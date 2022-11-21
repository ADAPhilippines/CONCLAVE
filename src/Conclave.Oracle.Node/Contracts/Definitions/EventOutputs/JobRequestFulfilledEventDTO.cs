using System.Numerics;
using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts;

namespace Conclave.Oracle.Node.Contracts.Definition.EventOutputs;

[Event("JobRequestFulfilled")]
public class JobRequestFulfilledEventDTO : IEventDTO
{
    [Parameter("uint256", "jobId", 1, false)]
    public BigInteger JobId { get; set; }
    [Parameter("address", "requester", 2, true)]
    public string Requester { get; set; } = string.Empty;
    [Parameter("uint256", "timestamp", 3, true)]
    public BigInteger Timestamp { get; set; }
}