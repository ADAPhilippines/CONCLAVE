using Conclave.Common.Utils;

namespace Conclave.Common.Models;


public class ConclaveHolder
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ConclaveEpoch? ConclaveEpoch { get; set; }
    public string Address { get; set; } = string.Empty;
    public ulong Quantity { get; set; }
    public DateTime DateCreated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
}