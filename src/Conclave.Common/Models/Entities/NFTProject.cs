using System.ComponentModel.DataAnnotations;
using Conclave.Common.Utils;

namespace Conclave.Common.Models;

public class NFTProject
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public NFTGroup NFTGroup { get; set; } = new();
    public string PolicyId { get; set; } = string.Empty;
    public int Weight { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime DateCreated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
    public DateTime DateUpdated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
}
