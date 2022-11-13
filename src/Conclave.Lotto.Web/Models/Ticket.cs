namespace Conclave.Lotto.Web.Models;


public record Ticket
{
    public string Date { get; set; } = default!;

    public int SessionId { get; set; }

    public int Combination { get; set; }

    public int Price { get; set; }

    public Status Status { get; set; }
}
