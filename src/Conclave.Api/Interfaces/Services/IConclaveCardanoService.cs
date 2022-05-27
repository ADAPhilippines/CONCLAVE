using Conclave.Common.Models;

namespace Conclave.Api.Interfaces.Services;


public interface IConclaveCardanoService
{
    Task<Epoch?> GetCurrentEpochAsync();
    Task<IEnumerable<Delegator>?> GetPoolDelegatorsAsync(string poolId, int? count = 100, int? page = 1);
    Task<IEnumerable<Holder>?> GetAssetHolders(string assetAddress, int? count = 100, int? page = 1);
    Task<IEnumerable<string?>> GetAssociatedWalletAddressAsync(string stakingId);
}