using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Contracts;

namespace Conclave.Oracle.Node.Contracts.Definition.EventOutputs;

[Event("NodeRegistered")]
public class NodeRegisteredEventDTO : IEventDTO
{
    [Parameter("address", "node", 1, true)]
    public string NodeAddress { get; set; } = string.Empty;
    
    [Parameter("address", "owner", 2, true)]
    public string OwnerAddress { get; set; } = string.Empty;
}