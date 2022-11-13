using System.Numerics;

namespace Conclave.Oracle.Node.Models;

public class RequestModel
{
    public string RequestId { get; set; }
    public BigInteger Timestamp { get; set; }
    public int NumberOfdecimals { get; set; }
    public RequestModel(string requestId, string timestamp, string numberOfDecimals)
    {
        RequestId = requestId;
        Timestamp = BigInteger.Parse(timestamp);
        NumberOfdecimals = int.Parse(numberOfDecimals);
    }
}