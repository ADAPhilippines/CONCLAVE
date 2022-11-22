namespace Conclave.Lotto.Web.Models;

public record TimeInterval
{
    public int Days { get; set; }
    
    public int Hours { get; set; }

    public int Minutes { get; set; }

    public int Seconds { get; set; }
}