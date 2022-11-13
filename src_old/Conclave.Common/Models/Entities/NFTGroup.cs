using System.ComponentModel.DataAnnotations;
using Conclave.Common.Utils;

namespace Conclave.Common.Models;

public class NFTGroup
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime DateCreated { get; set; } = DateUtils.AddOffsetToUtc(DateTime.UtcNow);
    public DateTime DateUpdated { get; set; } = DateUtils.AddOffsetToUtc(DateTime.UtcNow);
}