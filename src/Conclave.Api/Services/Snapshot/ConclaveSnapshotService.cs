using System.Collections.Generic;
using System.Threading.Tasks;
using Blockfrost.Api.Services;
using Conclave.Api.Interfaces;
using Conclave.Api.Options;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Conclave.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Polly;

namespace Conclave.Api.Services;

public class ConclaveSnapshotService : IConclaveSnapshotService
{
    private readonly IConclaveCardanoService _service;

    public ConclaveSnapshotService(IConclaveCardanoService service) { _service = service; }

    public async Task<ConclaveOwnerSnapshot?> SnapshotConclaveOwner(
        DelegatorSnapshot delegatorSnapshot,                                                         
        string policyId,
        ConclaveEpoch epoch)
    {
        var assets = await _service.GetAssetDetailsForStakeAddress(delegatorSnapshot.StakeAddress, policyId);

        if (assets is null) return null;

        var conclaveOwner = assets.FirstOrDefault();

        if (conclaveOwner is null) return null;
        if (conclaveOwner.Quantity == 0) return null;

        return new ConclaveOwnerSnapshot
        {
            ConclaveEpoch = epoch,
            DelegatorSnapshot = delegatorSnapshot,
            Quantity = (ulong)conclaveOwner.Quantity
        };
    }

    public async Task<IEnumerable<ConclaveOwnerSnapshot>> SnapshotConclaveOwnersAsync(
        string policyId,
        IEnumerable<DelegatorSnapshot> delegatorSnapshots,
        ConclaveEpoch epoch)
    {
        var conclaveOwners = new List<ConclaveOwnerSnapshot>();

        foreach (var delegatorSnapshot in delegatorSnapshots)
        {
            var conclaveOwner = await SnapshotConclaveOwner(delegatorSnapshot, policyId, epoch);

            if (conclaveOwner is null) continue;

            conclaveOwners.Add(conclaveOwner);
        }

        return conclaveOwners;
    }

    public async Task<IEnumerable<DelegatorSnapshot>> SnapshotDelegatorsAsync(string poolId, ConclaveEpoch epoch)
    {
        var page = 1;
        var delegatorSnapshots = new List<DelegatorSnapshot>();
        var uniqueDelegatorIds = new HashSet<string>();

        while (true)
        {
            var delegators = await _service.GetPoolDelegatorsAsync(poolId, 100, page);
            
            foreach (var delegator in delegators)
            {
                if (uniqueDelegatorIds.Contains(delegator.StakeId!)) continue;
                uniqueDelegatorIds.Add(delegator.StakeId!);

                var walletAddress = await _service.GetAssociatedWalletAddressAsync(delegator.StakeId!);
                delegatorSnapshots.Add(new DelegatorSnapshot
                {
                    ConclaveEpoch = epoch,
                    StakeAddress = delegator.StakeId!,
                    PoolAddress = poolId,
                    WalletAddress = walletAddress.First(),
                    Quantity = delegator.LovelacesAmount
                });
            }

            if (delegators.Count() < 100) break;

            page++;
        }

        return delegatorSnapshots;
    }

    public async Task<IEnumerable<DelegatorSnapshot>> SnapshotDelegatorsAsync(
        IEnumerable<string> poolIds, 
        ConclaveEpoch epoch)
    {
        var delegatorSnapshots = new List<DelegatorSnapshot>();
        foreach (var poolId in poolIds)
        {
            var partialSnapshots = await SnapshotDelegatorsAsync(poolId, epoch);
            if (partialSnapshots.Any()) delegatorSnapshots.AddRange(partialSnapshots.Where(d => d.Quantity > 0));
        }

        return delegatorSnapshots;
    }

    public async Task<NFTSnapshot?> SnapshotNFTsForStakeAddressAsync(
        NFTProject nftProject, 
        DelegatorSnapshot delegatorSnapshot, 
        ConclaveEpoch epoch)
    {
        var assets = await _service.GetAssetDetailsForStakeAddress(delegatorSnapshot.StakeAddress, nftProject.PolicyId);
        if (assets is null) return null;

        var conclaveNFTAssetCount = assets.Aggregate(0, (current, asset) => current + (int)asset.Quantity);
        if (conclaveNFTAssetCount == 0) return null;

        var nftSnapshot = new NFTSnapshot
        {
            ConclaveEpoch = epoch,
            DelegatorSnapshot = delegatorSnapshot,
            NFTProject = nftProject,
            Quantity = conclaveNFTAssetCount,
            Weight = conclaveNFTAssetCount * nftProject.Weight
        };

        return nftSnapshot;
    }

    public async Task<IEnumerable<NFTSnapshot>> SnapshotNFTsForStakeAddressesAsync(
        IEnumerable<NFTProject> nftProjects,
        IEnumerable<DelegatorSnapshot> delegatorSnapshots,
        ConclaveEpoch epoch)
    {
        var nftSnapshots = new List<NFTSnapshot>();
        foreach (var nftProject in nftProjects)
        {
            foreach (var delegatorSnapshot in delegatorSnapshots)
            {
                var nftSnapshot = await SnapshotNFTsForStakeAddressAsync(nftProject, delegatorSnapshot, epoch);

                if (nftSnapshot is null) continue;

                nftSnapshots.Add(nftSnapshot);
            }
        }

        return nftSnapshots;
    }

    public async Task<OperatorSnapshot> SnapshotOperatorAsync(string poolId, ConclaveEpoch epoch)
    {
        var owner = await _service.GetPoolOwnerAsync(poolId);

        var walletAddress = await _service.GetAssociatedWalletAddressAsync(owner.Address);
        var operatorSnapshot = new OperatorSnapshot
        {
            ConclaveEpoch = epoch,
            PoolAddress = poolId,
            StakeAddress = owner.Address,
            WalletAddress = walletAddress.First(),
            Pledge = owner.Pledge
        };

        return operatorSnapshot;
    }

    public async Task<IEnumerable<OperatorSnapshot>> SnapshotOperatorsAsync(
        IEnumerable<string> poolIds, 
        ConclaveEpoch epoch)
    {
        var operatosSnapshots = new List<OperatorSnapshot>();
        foreach (var poolId in poolIds)
        {
            var partialSnapshot = await SnapshotOperatorAsync(poolId, epoch);
            if (partialSnapshot is not null) operatosSnapshots.Add(partialSnapshot);
        }

        return operatosSnapshots;
    }
}