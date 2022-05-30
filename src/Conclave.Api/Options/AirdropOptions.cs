namespace Conclave.Api.Options;

public class AidropOptions
{

    public string ConclaveTokenWalletAddress { get; set; } = string.Empty;
    public string AdaWalletAddress { get; set; } = string.Empty;
    public int ConclaveTokenDistributionInterval { get; set; }
    public int AdaDistributionInterval { get; set; }
    public double ConclaveTokenAirdropThreshold { get; set; }
    public double AdaAirdropThreshold { get; set; }
    public double AdaFeePerTransaction { get; set; }
}