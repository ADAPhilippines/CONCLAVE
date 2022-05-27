using Conclave.Common.Utils;

namespace Conclave.Common.Models;

public class ConclaveEpochDelegator
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ConclaveSnapshot ConclaveSnapshot { get; set; } = new();
    public string WalletAddress { get; set; } = string.Empty;
    public DateTime DateCreated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
}