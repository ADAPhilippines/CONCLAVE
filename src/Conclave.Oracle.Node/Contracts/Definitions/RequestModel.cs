using System.Numerics;
using Nethereum.ABI.FunctionEncoding.Attributes;

namespace Conclave.Oracle.Node.Contracts.Definition;

 [FunctionOutput]
 public class PendingRequestOutputDTO : IFunctionOutputDTO
 {
      [Parameter("uint256", "requestId", 1)]
      public BigInteger RequestId { get; set; }

      [Parameter("uint256", "timestamp", 2)]
      public BigInteger TimeStamp { get; set; }

      [Parameter("uint256", "numberOfdecimals", 3)]
      public BigInteger NumberOfDecimals { get; set; }
 }