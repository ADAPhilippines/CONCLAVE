using System.Collections.Generic;
using System.Threading.Tasks;
using Blockfrost.Api.Services;
using Conclave.Api.Exceptions;
using Conclave.Api.Interfaces.Services;
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
    private readonly IConclaveEpochsService _epochsService;
    private readonly IConclavePoolsService _poolsService;
    private readonly ApplicationDbContext _context;

    public ConclaveSnapshotService(IConclaveEpochsService epochsService, IConclavePoolsService poolsService,
                                ApplicationDbContext context)
    {
        _epochsService = epochsService;
        _poolsService = poolsService;
        _context = context;
    }

    public HashSet<string?> GetSnapshottedStakingIdsForEpoch(long epochNumber)
    {
        return _context.ConclaveSnapshots
            .Where(s => s.ConclaveEpoch!.EpochNumber == epochNumber)
            .Where(s => s.SnapshotPeriod == SnapshotPeriod.Before)
            .Select(s => s.StakingId)
            .ToHashSet();
    }

    public async Task<ConclaveEpoch> PrepareNextSnapshotCycleAsync()
    {
        var seedConclaveEpoch = _epochsService.GetConclaveEpochsByEpochStatus(EpochStatus.Seed).FirstOrDefault();

        if (seedConclaveEpoch is null) throw new SeedEpochNotYetCreatedException();

        var newConclaveEpoch = _epochsService.GetConclaveEpochsByEpochStatus(EpochStatus.New).FirstOrDefault();

        if (newConclaveEpoch is not null) throw new NewConclaveEpochAlreadyCreatedException();

        // Get current/seed conclave epoch
        var currentConclaveEpoch = _epochsService.GetConclaveEpochsByEpochStatus(EpochStatus.Current).FirstOrDefault();
        var prevConclaveEpoch = currentConclaveEpoch ?? seedConclaveEpoch;

        // Create a new conclave epoch based on the current/seed epoch
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

        // Save changes
        _context.Add(newConclaveEpoch);
        await _context.SaveChangesAsync();

        return newConclaveEpoch;
    }

    public async Task<List<ConclaveSnapshot>> SnapshotPoolsAsync()
    {
        var newConclaveEpoch = _epochsService.GetConclaveEpochsByEpochStatus(EpochStatus.New).First();
        if (newConclaveEpoch is null) throw new NextSnapshotCycleNotYetReadyException();

        var currentEpoch = await _epochsService.GetCurrentEpochAsync(); // current 
        if (newConclaveEpoch.SnapshotStatus == SnapshotStatus.InProgress && currentEpoch.Number < newConclaveEpoch.EpochNumber)
            throw new SnapshotTooEarlyException();

        var currentDelegators = await _poolsService.GetAllUniquePoolDelegatorsAsync();

        List<ConclaveSnapshot> snapshotList = new();

        SnapshotPeriod snapshotPeriod = newConclaveEpoch.SnapshotStatus == SnapshotStatus.New
                            ? SnapshotPeriod.Before : SnapshotPeriod.After;

        HashSet<string?> existingStakingIdsForNewEpoch = new();
        if (snapshotPeriod == SnapshotPeriod.After)
        {
            existingStakingIdsForNewEpoch = GetSnapshottedStakingIdsForEpoch(newConclaveEpoch.EpochNumber);
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

            // skip duplicate entries
            if (snapshotPeriod == SnapshotPeriod.After && existingStakingIdsForNewEpoch.Contains(snapshot.StakingId))
                continue;

            existingStakingIdsForNewEpoch.Add(snapshot.StakingId);

            snapshotList.Add(snapshot);
        }

        // Update ConclaveEpoch snapshot status
        newConclaveEpoch.SnapshotStatus = newConclaveEpoch.SnapshotStatus == SnapshotStatus.New
                    ? SnapshotStatus.InProgress : SnapshotStatus.Completed;
        newConclaveEpoch.DateUpdated = DateUtils.DateTimeToUtc(DateTime.Now);

        _context.ConclaveSnapshots.AddRange(snapshotList);
        await _context.SaveChangesAsync();

        return snapshotList;
    }
}