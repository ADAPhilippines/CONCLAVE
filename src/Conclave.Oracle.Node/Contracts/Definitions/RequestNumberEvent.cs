using System.Numerics;
using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.RPC.Eth.DTOs;
using Nethereum.Hex.HexTypes;
using Nethereum.Contracts;
using Nethereum.Web3;
using Nethereum.Contracts.CQS;
using System.Threading;

namespace Conclave.Oracle.Node.Contracts.Definition;

[Event("RequestCreated")]
public class RequestCreatedEventDTO : IEventDTO
{
    [Parameter("uint256", "requestId", 1, true)]
    public BigInteger RequestId { get; set; }
    [Parameter("uint256", "timestamp", 2, true)]
    public BigInteger TimeStamp { get; set; }
    [Parameter("uint256", "numberOfdecimals", 3, true)]
    public BigInteger NumberOfDecimals { get; set; }
}