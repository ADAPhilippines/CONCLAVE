using Blockfrost.Api.Models;
using Blockfrost.Api.Services;
using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Microsoft.EntityFrameworkCore;

namespace Conclave.Api.Services;


public class ConclaveBlockfrostCardanoService : IConclaveCardanoService
{
    private readonly IEpochsService _epochsService;
    private readonly IPoolsService _poolsService;
    private readonly IAccountsService _accountsService;
    private readonly IAssetsService _assetsService;

    public ConclaveBlockfrostCardanoService(
        IEpochsService epochsService,
        IPoolsService poolsService,
        IAccountsService accountsService,
        IAssetsService assetsService)
    {
        _epochsService = epochsService;
        _poolsService = poolsService;
        _accountsService = accountsService;
        _assetsService = assetsService;
    }

    public async Task<IEnumerable<Asset>?> GetAssetDetailsForStakeAddress(string stakeAddress, string policyId)
    {
        var assets = await GetStakeAddressAssetsAsync(stakeAddress);

        if (stakeAddress == "stake1uyjpkz0n2dn4un8n4dz7nfq8e670756mrndkkfmv4jdz0ys46e0z7")
        {
            System.Console.WriteLine("Here");
        }

        if (assets.Assets.Count < 1) return null;

        return assets.Assets.FindAll(a => a.Unit.Contains(policyId)).ToList();
    }

    public async Task<IEnumerable<AssetOwner>> GetAssetOwnersAsync(string assetAddress)
    {
        var page = 1;
        var assetOwners = new List<AssetOwner>();

        while (true)
        {
            var holders = await _assetsService.GetAddressesAsync(assetAddress, 100, page);

            foreach (var holder in holders)
            {
                assetOwners.Add(new AssetOwner(assetAddress, holder.Address, ulong.Parse(holder.Quantity)));
            }

            if (holders.Count < 100) break;
            page++;
        }

        return assetOwners;
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

    public async Task<IEnumerable<Delegator>> GetPoolDelegatorsAsync(
        string poolId, 
        int? count = 100, 
        int? page = 1)
    {
        if (count > 100) count = 100;
        if (count < 1) count = 100;
        if (page < 1) page = 1;

        var poolDelegators = await _poolsService.GetDelegatorsAsync(poolId, count, page);
        List<Delegator> delegators = poolDelegators
                                    .Select(t => 
                                        new Delegator(t.Address, ulong.Parse(t.LiveStake)))
                                    .ToList() ?? new List<Delegator>();

        return delegators;
    }

    public async Task<Operator> GetPoolOwnerAsync(string poolId)
    {
        var details = await _poolsService.GetPoolsAsync(poolId);
        var stakeAddress = details.Owners.First();
        var pledge = ulong.Parse(details.LivePledge);
        return new Operator(stakeAddress, pledge);
    }

    public async Task<StakeAddressReward?> GetStakeAddressReward(
        string stakeAddress, 
        long epochNumber)
    {
        var result = await _accountsService.GetRewardsAsync(stakeAddress);
        var stakeReward = result
                        .Where(t => t.Epoch == epochNumber)
                        .FirstOrDefault();
        return new StakeAddressReward(
            stakeAddress, 
            long.Parse(string.IsNullOrEmpty(stakeReward?.Amount) ? "-1" : stakeReward.Amount), 
            (ulong)(stakeReward?.Epoch ?? 0));
    }

    public async Task<StakeAddressAssets> GetStakeAddressAssetsAsync(string stakeAddress)
    {
        var page = 1;
        var stakeAddressAssets = new StakeAddressAssets(stakeAddress, new List<Asset>());

        while (true)
        {
            var assets = await _accountsService.GetAddressesAssetsAsync(stakeAddress, 100, page);

            foreach (var asset in assets)
            {
                stakeAddressAssets.Assets.Add(new Asset(asset.Unit, ulong.Parse(asset.Quantity)));
            }

            if (assets.Count < 100) break;
            page++;
        }

        return stakeAddressAssets;
    }
}