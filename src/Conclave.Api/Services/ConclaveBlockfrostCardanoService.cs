using Blockfrost.Api.Services;
using Conclave.Api.Interfaces.Services;
using Conclave.Common.Models;
using Conclave.Common.Utils;

namespace Conclave.Api.Services;


public class ConclaveBlockfrostCardanoService : IConclaveCardanoService
{
    private readonly IEpochsService _epochsService;
    private readonly IPoolsService _poolsService;
    private readonly IAccountsService _accountsService;
    private readonly IAssetsService _assetsService;

    public ConclaveBlockfrostCardanoService(IEpochsService epochsService,
                                            IPoolsService poolsService,
                                            IAccountsService accountsService,
                                            IAssetsService assetsService)
    {
        _epochsService = epochsService;
        _poolsService = poolsService;
        _accountsService = accountsService;
        _assetsService = assetsService;
    }

    public async Task<IEnumerable<Holder>> GetAssetHolders(string assetAddress, int? count = 100, int? page = 1)
    {
        if (count > 100) count = 100;
        if (count < 1) count = 100;
        if (page < 1) page = 1;

        var assetHolders = await _assetsService.GetAddressesAsync(assetAddress, count, page);
        List<Holder> holders = new();

        foreach (var assetHolder in assetHolders)
        {
            holders.Add(new Holder(assetHolder.Address, ulong.Parse(assetHolder.Quantity)));
        }

        return holders;
    }

    public async Task<IEnumerable<string>> GetAssociatedWalletAddressAsync(string stakingId)
    {
        var addresses = await _accountsService.GetAddressesAsync(stakingId);
        List<string> stringAddresses = new();

        foreach (var address in addresses) stringAddresses.Add(address.Address);

        return stringAddresses;
    }

    public async Task<Epoch> GetCurrentEpochAsync()
    {
        var currentEpoch = await _epochsService.GetLatestAsync();

        return new Epoch((ulong)currentEpoch.Epoch,
        DateUtils.UnixTimeStampToDateTime(currentEpoch.StartTime),
        DateUtils.UnixTimeStampToDateTime(currentEpoch.EndTime));
    }

    public async Task<IEnumerable<Delegator>> GetPoolDelegatorsAsync(string poolId, int? count = 100, int? page = 1)
    {
        if (count > 100) count = 100;
        if (count < 1) count = 100;
        if (page < 1) page = 1;

        var poolDelegators = await _poolsService.GetDelegatorsAsync(poolId, count, page);
        List<Delegator> delegators = new();

        foreach (var poolDelegator in poolDelegators) delegators.Add(new Delegator(poolDelegator.Address, ulong.Parse(poolDelegator.LiveStake)));

        return delegators;
    }
}