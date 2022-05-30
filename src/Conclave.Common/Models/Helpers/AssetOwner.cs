namespace Conclave.Common.Models;


public class AssetOwner
{
    public AssetOwner(string assetAddress, string walletAddress, ulong quantity)
    {
        AssetAddress = assetAddress;
        WalletAddress = walletAddress;
        Quantity = quantity;
    }
    public string WalletAddress { get; set; } = string.Empty;
    public string AssetAddress { get; set; } = string.Empty;
    public ulong Quantity { get; set; }
}