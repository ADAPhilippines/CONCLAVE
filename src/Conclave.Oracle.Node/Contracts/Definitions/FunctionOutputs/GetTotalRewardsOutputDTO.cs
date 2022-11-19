using System.Numerics;
using Nethereum.ABI.FunctionEncoding.Attributes;

namespace Conclave.Oracle.Node.Contracts.Definition.FunctionOutputs;

[FunctionOutput]
public class GetTotalRewardsOutputDTO : IFunctionOutputDTO
{
    [Parameter("uint256", 1)]
    public BigInteger ADAReward { get; set; }

    [Parameter("uint256", 2)]
    public BigInteger CNCLVReward { get; set; }
}