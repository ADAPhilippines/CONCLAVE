using System.Numerics;
using Conclave.Oracle.Node.Interfaces;

namespace Conclave.Oracle.Node.Models;

public class NetworkBase : INetwork
{
    public BigInteger ZeroTime { get; set; }
    public BigInteger ZeroSlot { get; set; }
    public BigInteger SlotLength { get; set; }

    public NetworkBase(BigInteger zeroTime, BigInteger zeroSlot, BigInteger slotLength)
    {
        ZeroTime = zeroTime;
        ZeroSlot = zeroSlot;
        SlotLength = slotLength;
    }

    public int UnixTimeMsToSlot(BigInteger unixTimeMs)
    {
        BigInteger timePassed = (unixTimeMs - ZeroTime);
        BigInteger slotsPassed = BigInteger.Parse(Math.Floor((float)(timePassed / SlotLength)).ToString());
        return (int)(slotsPassed + ZeroSlot);
    }
}