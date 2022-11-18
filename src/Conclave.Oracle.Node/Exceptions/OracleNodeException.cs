namespace Conclave.Oracle.Node.Exceptions;

public class OracleNodeException : Exception
{
    public OracleNodeException() : base() { }
    public OracleNodeException(string message) : base(message) { }
    public OracleNodeException(string message, Exception inner) : base(message, inner) { }
}