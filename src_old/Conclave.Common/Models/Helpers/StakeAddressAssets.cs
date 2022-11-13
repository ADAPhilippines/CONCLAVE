namespace Conclave.Common.Models;

public class StakeAddressAssets
{
    public string StakeAddress { get; set; } = string.Empty;
    public List<Asset> Assets { get; set; } = new List<Asset>();

    public StakeAddressAssets(string stakeAddress, List<Asset> assets)
    {
        StakeAddress = stakeAddress;
        Assets = assets;
    }
}