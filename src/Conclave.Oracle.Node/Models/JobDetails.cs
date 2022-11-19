using System.Numerics;
using Nethereum.ABI.FunctionEncoding.Attributes;

namespace Conclave.Oracle.Node.Models;

[FunctionOutput]
 public class GetJobDetailsOutputDTO : IFunctionOutputDTO
 {
      [Parameter("uint256", "fee", 1)]
      public BigInteger Fee { get; set; }
      [Parameter("uint256", "feerPerNum", 2)]
      public BigInteger FeePerNum { get; set; }
      [Parameter("uint256", "tokenFee", 3)]
      public BigInteger TokenFee { get; set; }
      [Parameter("uint256", "tokenFeePerNum", 4)]
      public BigInteger TokenFeePerNum { get; set; }
      [Parameter("uint256", "numCount", 5)]
      public BigInteger NumCount { get; set; }
      [Parameter("uint256", "acceptanceTimeLimit", 6)]
      public BigInteger AcceptanceTimeLimit { get; set; }
      [Parameter("uint256", "validators", 7)]
      public List<string> Validators { get; set; } = new List<string>();
      
 }
