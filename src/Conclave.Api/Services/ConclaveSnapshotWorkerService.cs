using Blockfrost.Api.Services;
using Conclave.Api.Interfaces.Services;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Conclave.Data;

namespace Conclave.Api.Services;

public class ConclaveSnapshotWorkerService : IConclaveSnapshotWorkerService
{
    private readonly IConclaveCardanoService _service;
    private readonly ApplicationDbContext _context;

    public ConclaveSnapshotWorkerService(IConclaveCardanoService service, ApplicationDbContext context)
    {
        _service = service;
        _context = context;
    }

    public async Task<IEnumerable<ConclaveSnapshot?>> SnapshotDelegatorsForPoolAsync(string poolId, ConclaveEpoch conclaveEpoch)
    {
        var delegators = new List<Delegator>();

        var page = 1;
        while (true)
        {
            var partialDelegators = await _service.GetPoolDelegatorsAsync(poolId, 100, page);
            delegators.AddRange(partialDelegators!);

            if (partialDelegators.Count() < 100) break;
            page++;
        }

        List<ConclaveSnapshot?> snapshotList = new();

        foreach (var delegator in delegators)
        {
            snapshotList.Add(new ConclaveSnapshot
            {
                ConclaveEpoch = conclaveEpoch,
                StakingId = delegator.StakeId,
                PoolId = poolId,
                DelegatedAmount = delegator.LovelacesAmount,
                DateCreated = DateUtils.DateTimeToUtc(DateTime.Now)
            });
        }

        return snapshotList;
    }

    public async Task<IEnumerable<ConclaveSnapshot?>> SnapshotDelegatorsForPoolsAsync(IEnumerable<string> poolIds, ConclaveEpoch conclaveEpoch)
    {
        List<ConclaveSnapshot?> conclaveSnapshotList = new();

        foreach (var poolId in poolIds)
        {
            var partialSnapshotList = await SnapshotDelegatorsForPoolAsync(poolId, conclaveEpoch);
            if (!partialSnapshotList.Any()) continue;
            conclaveSnapshotList.AddRange(partialSnapshotList);
        }

        return conclaveSnapshotList;
    }

    public async Task<IEnumerable<ConclaveHolder>?> SnapshotHoldersForAssetAsync(string assetAddress, ConclaveEpoch conclaveEpoch)
    {
        var holders = new List<Holder>();

        var page = 1;
        while (true)
        {
            var partialHolders = await _service.GetAssetHolders(assetAddress, 100, page);
            holders.AddRange(partialHolders!);

            if (partialHolders.Count() < 100) break;
            page++;
        }

        List<ConclaveHolder>? snapshotList = new();

        foreach (var holder in holders)
        {
            snapshotList.Add(new ConclaveHolder
            {
                ConclaveEpoch = conclaveEpoch,
                Address = holder.Address,
                Quantity = holder.Quantity,
                DateCreated = DateUtils.DateTimeToUtc(DateTime.Now)
            });
        }

        return snapshotList;
    }

    public async Task<IEnumerable<ConclaveSnapshot?>> SnapshotUniqueDelegatorsForPoolAsync(string poolId, ConclaveEpoch conclaveEpoch)
    {
        var uncheckedSnapshotList = await SnapshotDelegatorsForPoolAsync(poolId, conclaveEpoch);
        var uniqueDelegatorStakingId = new HashSet<string>();
        var snapshotList = new List<ConclaveSnapshot>();

        foreach (var uncheckedSnapshot in uncheckedSnapshotList)
        {
            if (uniqueDelegatorStakingId.Contains(uncheckedSnapshot!.StakingId!)) continue;

            snapshotList.Add(uncheckedSnapshot);
            uniqueDelegatorStakingId.Add(uncheckedSnapshot!.StakingId!);
        }

        return snapshotList;
    }

    public async Task<IEnumerable<ConclaveSnapshot?>> SnapshotUniqueDelegatorsForPoolsAsync(IEnumerable<string> poolIds, ConclaveEpoch conclaveEpoch)
    {
        List<ConclaveSnapshot?> conclaveSnapshotList = new();

        foreach (var poolId in poolIds)
        {
            var partialSnapshotList = await SnapshotUniqueDelegatorsForPoolAsync(poolId, conclaveEpoch);
            if (!partialSnapshotList.Any()) continue;
            conclaveSnapshotList.AddRange(partialSnapshotList);
        }

        return conclaveSnapshotList;
    }

    public async Task<IEnumerable<ConclaveHolder>?> SnapshotUniqueHoldersForAssetAsync(string assetAddress, ConclaveEpoch conclaveEpoch)
    {
        var uncheckedSnapshotList = await SnapshotHoldersForAssetAsync(assetAddress, conclaveEpoch);
        var uniqueHolderWalletAddress = new HashSet<string>();
        var snapshotList = new List<ConclaveHolder>();

        foreach (var uncheckedSnapshot in uncheckedSnapshotList)
        {
            if (uniqueHolderWalletAddress.Contains(uncheckedSnapshot!.Address!)) continue;

            snapshotList.Add(uncheckedSnapshot);
            uniqueHolderWalletAddress.Add(uncheckedSnapshot.Address!);
        }

        return snapshotList;
    }

    public async Task<IEnumerable<ConclaveSnapshot>> StoreDelegatorSnapshotDataAsync(IEnumerable<ConclaveSnapshot?> snapshotList)
    {
        if (!snapshotList.Any() || snapshotList is null) throw new Exception("Delegator Snapshot list must not be empty");
        _context.ConclaveSnapshots.AddRange(snapshotList!);
        await _context.SaveChangesAsync();
        return snapshotList!;
    }

    public async Task<IEnumerable<ConclaveHolder>> StoreHolderSnapshotDataAsync(IEnumerable<ConclaveHolder?> snapshotList)
    {
        if (!snapshotList.Any() || snapshotList is null) throw new Exception("Holder Snapshot list must not be empty");
        _context.ConclaveHolders.AddRange(snapshotList!);
        await _context.SaveChangesAsync();
        return snapshotList!;
    }
}