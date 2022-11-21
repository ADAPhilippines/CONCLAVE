using System.Numerics;
using Nethereum.ABI.FunctionEncoding.Attributes;

namespace Conclave.Oracle.Node.Contracts.Definition.FunctionOutputs;

[FunctionOutput]
public class GetPendingRewardJobIdsOutputDTO : IFunctionOutputDTO
{
    [Parameter("uint256[]", null, 1)]
    public List<BigInteger> JobIds { get; set; } = new List<BigInteger>();
}