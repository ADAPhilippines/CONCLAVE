namespace Conclave.Common.Models;


public class Holder
{
    public string? Address { get; set; } = string.Empty;
    public ulong Quantity { get; set; }
    
    public Holder(string address, ulong quantity)
    {
        Address = address;
        Quantity = quantity;
    }
}