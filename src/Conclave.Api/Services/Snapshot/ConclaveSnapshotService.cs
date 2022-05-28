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

    public ConclaveSnapshotService(IConclaveCardanoService service)
    {
        _service = service;
    }

    public ConclaveOwnerSnapshot? SnapshotConclaveOwner(DelegatorSnapshot delegatorSnapshot,
                                                        ConclaveEpoch epoch,
                                                        IEnumerable<AssetOwner> assetOwners)
    {
        var conclaveOwner = assetOwners.FirstOrDefault(o => o.WalletAddress == delegatorSnapshot.WalletAddress);

        if (conclaveOwner is null) return null;


        return new ConclaveOwnerSnapshot
        {
            ConclaveEpoch = epoch,
            DelegatorSnapshot = delegatorSnapshot,
            Quantity = conclaveOwner.Quantity
        };

    }

    public async Task<IEnumerable<ConclaveOwnerSnapshot>> SnapshotConclaveOwnersAsync(string assetAddress,
                                                                                      IEnumerable<DelegatorSnapshot> delegatorSnapshots,
                                                                                      ConclaveEpoch epoch)
    {
        var conclaveOwners = new List<ConclaveOwnerSnapshot>();
        var assetOwners = await _service.GetAssetOwnersAsync(assetAddress);

        foreach (var delegatorSnapshot in delegatorSnapshots)
        {
            var conclaveOwner = SnapshotConclaveOwner(delegatorSnapshot, epoch, assetOwners);

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

    public async Task<IEnumerable<DelegatorSnapshot>> SnapshotDelegatorsAsync(IEnumerable<string> poolIds, ConclaveEpoch epoch)
    {
        var delegatorSnapshots = new List<DelegatorSnapshot>();

        foreach (var poolId in poolIds)
        {
            var partialSnapshots = await SnapshotDelegatorsAsync(poolId, epoch);
            if (partialSnapshots.Any()) delegatorSnapshots.AddRange(partialSnapshots);
        }

        return delegatorSnapshots;
    }

    public Task<IEnumerable<NFTSnapshot>> SnapshotNFTsAsync(NFTProject nfTProject, DelegatorSnapshot delegatorSnapshot, ConclaveEpoch epoch)
    {
        throw new NotImplementedException();
    }

    public Task<IEnumerable<NFTSnapshot>> SnapshotNFTsAsync(IEnumerable<NFTProject> nftProjects,
                                                            IEnumerable<DelegatorSnapshot> delegatorSnapshots,
                                                            ConclaveEpoch epoch)
    {
        throw new NotImplementedException();
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

    public async Task<IEnumerable<OperatorSnapshot>> SnapshotOperatorsAsync(IEnumerable<string> poolIds, ConclaveEpoch epoch)
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