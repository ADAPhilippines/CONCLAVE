using System.Numerics;

namespace Conclave.Oracle.Node.Interfaces;

public interface INetwork
{
    BigInteger ZeroTime { get; set; }
    BigInteger ZeroSlot { get; set; }
    BigInteger SlotLength { get; set; }

    int UnixTimeMsToSlot(BigInteger unixTimeMs);
}