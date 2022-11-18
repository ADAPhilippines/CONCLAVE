using System.Numerics;

namespace Conclave.Oracle.Node.Attributes;

public class LoggingComponentAttribute : Attribute
{
    public string? Scope { get; set; }
    public string RequestId { get; set; }
    public string Message { get; set; } = string.Empty;
    public LoggingComponentAttribute (string requestId, string message)
    {
        RequestId = requestId;
        Message = message;
        Console.WriteLine("Hello");
    }

    public void LogMessage()
    {
        Console.WriteLine("Hello");
    }
}