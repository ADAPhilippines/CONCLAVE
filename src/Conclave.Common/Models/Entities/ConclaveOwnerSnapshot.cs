using Conclave.Common.Utils;

namespace Conclave.Common.Models;

public class ConclaveOwnerSnapshot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ConclaveEpoch ConclaveEpoch { get; set; } = new();
    public DelegatorSnapshot DelegatorSnapshot { get; set; } = new();
    public ulong Quantity { get; set; }
    public DateTime DateCreated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
    public DateTime DateUpdated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
}