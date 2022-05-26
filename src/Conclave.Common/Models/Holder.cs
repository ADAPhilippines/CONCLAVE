namespace Conclave.Common.Models;


public class Holder
{
    public Holder(string address, ulong quantity)
    {
        Address = address;
        Quantity = quantity;
    }

    public string Address { get; set; } = string.Empty;
    public ulong Quantity { get; set; }
}