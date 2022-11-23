using System.Numerics;
using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts;

namespace Conclave.Oracle.Node.Contracts.Definition.EventOutputs;

[Event("JobAccepted")]
public class JobAcceptedEventDTO : IEventDTO
{
    [Parameter("uint256", "jobId", 1, true)]
    public BigInteger JobId { get; set; }

    [Parameter("address", "node", 2, true)]
    public string NodeAddress { get; set; } = string.Empty;
    
    [Parameter("uint256", "jobAcceptanceExpiration", 3, false)]
    public BigInteger JobAcceptanceExpiration { get; set; }
}