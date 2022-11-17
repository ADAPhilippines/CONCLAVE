namespace Conclave.Lotto.Web.Models;

public enum Status
{
    OnGoing,
    UpComing,
}

public record Session
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public Status CurrentStatus { get; set; } = Status.UpComing;

    public string OwnerAddress { get; set; } = string.Empty;

    public int PrizePool { get; set; }

    public int TicketPrice { get; set; }

    public int Combinations { get; set; }

    public int MaxValue { get; set; }

    public int Margin { get; set; }

    public DateTime? StartDate { get; set; } = DateTime.Today;

    public DateTime? DateCreated { get; set; } = DateTime.Today;
    public int Interval { get; set; }
}
