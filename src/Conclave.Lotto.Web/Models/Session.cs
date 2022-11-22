using System.ComponentModel.DataAnnotations;

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

    [Range(1, 10)]
    public int Combinations { get; set; }
    
    [Range(0, 99)]
    public int MaxValue { get; set; }

    public int Margin { get; set; }

    public DateTime StartDate { get; set; }

    public DateTime DateCreated { get; set; }

    public TimeSpan StartTime { get; set; }

    public TimeInterval TimeIntervals { get; set; } = new();
}
