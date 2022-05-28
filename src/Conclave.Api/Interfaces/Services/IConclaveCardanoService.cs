using Conclave.Common.Models;

namespace Conclave.Api.Interfaces;


public interface IConclaveCardanoService
{
    Task<Epoch> GetCurrentEpochAsync();
    Task<IEnumerable<Delegator>> GetPoolDelegatorsAsync(string poolId, int? count = 100, int? page = 1);
    Task<IEnumerable<string>> GetAssociatedWalletAddressAsync(string stakingId);
    Task<Operator> GetPoolOwnerAsync(string poolId);
    Task<IEnumerable<AssetOwner>> GetAssetOwnersAsync(string assetAddress);
}