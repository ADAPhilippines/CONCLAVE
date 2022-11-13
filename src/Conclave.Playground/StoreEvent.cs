using System.Numerics;
using Nethereum.ABI.FunctionEncoding.Attributes;
using Nethereum.Hex.HexTypes;

[Event("StoreEvent")]
public class StoreEvent
{
    [Parameter("uint256", "num", 1, false)]
    public BigInteger Num { get; set; }
}