namespace Conclave.Common.Models;

public class ConclaveDistributionParameters
{
    public ulong SaturationAmount { get; set; }
    public ulong DeltaInitialSaturationValue { get; set; }
    public decimal SaturationRate { get; set; }
}