namespace Conclave.Common.Models;

public class Asset
{
    public string Unit { get; set; } = string.Empty;
    public double Quantity { get; set; }

    public Asset(string unit, double quantity)
    {
        Unit = unit;
        Quantity = quantity;
    }
}