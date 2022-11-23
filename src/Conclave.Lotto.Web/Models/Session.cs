using System.ComponentModel.DataAnnotations;

namespace Conclave.Lotto.Web.Models;

public enum Status
{
    Ongoing,
    Upcoming,
}

public record Session
{
    public int Id { get; set; }
    
    [Required]
    public string Name { get; set; }

    public Status CurrentStatus { get; set; } = Status.Upcoming;

    public string? OwnerAddress { get; set; } = string.Empty;
    
    [Required]
    public int PrizePool { get; set; }

    [Required]
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
