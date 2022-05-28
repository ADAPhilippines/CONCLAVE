using Conclave.Common.Utils;

namespace Conclave.Common.Models;


public class NFTSnapshot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public ConclaveEpoch ConclaveEpoch { get; set; } = new();
    public string AssetAddress { get; set; } = string.Empty;
    public string WalletAddress { get; set; } = string.Empty;
    public NFTProject NFTProject { get; set; } = new();
    public DateTime DateCreated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
    public DateTime DateUpdated { get; set; } = DateUtils.DateTimeToUtc(DateTime.Now);
}