namespace Conclave.Snapshot.Capture.Services;

using System.Collections.Generic;
using System.Threading.Tasks;
using Blockfrost.Api.Services;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Conclave.Server.Data;
using Conclave.Snapshot.Capture.Exceptions;
using Conclave.Snapshot.Capture.Interfaces.Services;
using Conclave.Snapshot.Capture.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Polly;

public class ConclaveSnapshotService : IConclaveSnapshotService
{
    private readonly IConclaveEpochsService _epochsService;
    private readonly IConclavePoolsService _poolsService;
    private readonly IOptions<ConclaveCardanoOptions> _options;
    private readonly ApplicationDbContext _context;

    public ConclaveSnapshotService(IConclaveEpochsService epochsService, IConclavePoolsService poolsService,
                                IOptions<ConclaveCardanoOptions> options, ApplicationDbContext context)
    {
        _epochsService = epochsService;
        _poolsService = poolsService;
        _options = options;
        _context = context;
    }

    public async Task<ConclaveEpoch> PrepareNextSnapshotCycleAsync()
    {
        var seedConclaveEpoch = _epochsService.GetConclaveEpochsByEpochStatus(EpochStatus.Seed).FirstOrDefault();

        if (seedConclaveEpoch is null) throw new SeedEpochNotYetCreatedException();

        var newConclaveEpoch = _epochsService.GetConclaveEpochsByEpochStatus(EpochStatus.New).FirstOrDefault();

        if (newConclaveEpoch is not null) throw new NewConclaveEpochNotYetCreatedException();

        var currentConclaveEpoch = _epochsService.GetConclaveEpochsByEpochStatus(EpochStatus.Current).FirstOrDefault();
        var prevConclaveEpoch = currentConclaveEpoch ?? seedConclaveEpoch;

        newConclaveEpoch = new ConclaveEpoch
        {
            EpochNumber = prevConclaveEpoch.EpochNumber + 1,
            EpochStatus = EpochStatus.New,
            StartTime = null,
            EndTime = null,
            SnapshotStatus = SnapshotStatus.New,
            RewardStatus = RewardStatus.New,
            AirdropStatus = AirdropStatus.New
        };

        _context.Add(newConclaveEpoch);
        await _context.SaveChangesAsync();

        return newConclaveEpoch;
    }

    public async Task<List<ConclaveSnapshot>> SnapshotPoolsAsync()
    {

        var newConclaveEpoch = _epochsService.GetConclaveEpochsByEpochStatus(EpochStatus.New).First();

        if (newConclaveEpoch is null) throw new NextSnapshotCycleNotYetReadyException();

        var currentEpoch = await _epochsService.GetCurrentEpochAsync();

        if (newConclaveEpoch.SnapshotStatus == SnapshotStatus.InProgress && currentEpoch.Number < newConclaveEpoch.EpochNumber)
            throw new NewEpochNotYetCreatedException();

        var poolIds = _options.Value.PoolIds.ToList();
        var currentDelegators = new List<Delegator>();

        foreach (var poolId in poolIds)
        {
            var poolDelegators = await _poolsService.GetPoolDelegatorsAsync(poolId);
            poolDelegators.ForEach(delegator => currentDelegators.Add(delegator));
        }

        List<ConclaveSnapshot> snapshotList = new();
        SnapshotPeriod snapshotPeriod = newConclaveEpoch.SnapshotStatus == SnapshotStatus.New
                            ? SnapshotPeriod.Before : SnapshotPeriod.After;

        var beforeSnapshots = new List<ConclaveSnapshot>();
        if (snapshotPeriod == SnapshotPeriod.After)
        {
            beforeSnapshots = _context.ConclaveSnapshots
                .Where(s => s.ConclaveEpoch!.EpochNumber == newConclaveEpoch.EpochNumber)
                .Where(s => s.SnapshotPeriod == SnapshotPeriod.Before).ToList();
        }

        foreach (var delegator in currentDelegators)
        {
            var snapshot = new ConclaveSnapshot
            {
                ConclaveEpoch = newConclaveEpoch,
                StakingId = delegator.StakeId,
                DelegatedAmount = delegator.LovelacesAmount,
                SnapshotPeriod = snapshotPeriod,
                DateCreated = DateUtils.DateTimeToUtc(DateTime.Now)
            };

            // filter duplicates
            if (snapshotPeriod == SnapshotPeriod.After
                && beforeSnapshots.Where(s => s.StakingId
                    == snapshot.StakingId).FirstOrDefault() is not null)
            {
                continue;
            }

            snapshotList.Add(snapshot);

            _context.Add(snapshot);
        }

        // Update ConclaveEpoch snapshot status
        newConclaveEpoch.SnapshotStatus = newConclaveEpoch.SnapshotStatus == SnapshotStatus.New
                    ? SnapshotStatus.InProgress : SnapshotStatus.Completed;
        newConclaveEpoch.DateUpdated = DateUtils.DateTimeToUtc(DateTime.Now);

        await _context.SaveChangesAsync();

        return snapshotList;
    }
}