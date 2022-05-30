using Conclave.Common.Utils;

namespace Conclave.Common.Models;


public class NFTSnapshot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ConclaveEpoch ConclaveEpoch { get; set; } = new();
    public DelegatorSnapshot DelegatorSnapshot { get; set; } = new();
    public NFTProject NFTProject { get; set; } = new();
    public int Quantity { get; set; }
    public DateTime DateCreated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
    public DateTime DateUpdated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
}