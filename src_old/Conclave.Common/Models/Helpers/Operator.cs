namespace Conclave.Common.Models;

public class Operator
{
    public string Address { get; set; } = string.Empty;
    public ulong Pledge { get; set; }

    public Operator(string address, ulong pledge)
    {
        Address = address;
        Pledge = pledge;
    }
}
