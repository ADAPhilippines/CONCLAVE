namespace Conclave.Snapshot.Server.Services;

using System.Collections.Generic;
using System.Threading.Tasks;
using Blockfrost.Api.Services;
using Conclave.Server.Options;
using Conclave.Snapshot.Server.Data;
using Conclave.Snapshot.Server.Enums;
using Conclave.Snapshot.Server.Interfaces.Services;
using Conclave.Snapshot.Server.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

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
    public async Task<List<ConclaveSnapshot>> SnapshotPoolsAsync()
    {
        var poolId = _options.Value.PoolIds.FirstOrDefault() ?? "cba1419077fd3a23e5036727a3994e6dd0c5dcd259bdb89df6863431";
        var currentEpoch = await _epochsService.GetCurrentEpoch(poolId);
        var currentDelegators = await _poolsService.GetPoolDelegatorsAsync(poolId);
        List<ConclaveSnapshot> snapshotList = new();

        // can be put in a helper function
        DateTime currentTime = new();
        SnapshotPeriod snapshotPeriod = currentTime < currentEpoch.EndTime ? SnapshotPeriod.Before : SnapshotPeriod.After;

        // create temporary epoch for testing but data should come from the database in the final implementation
        // ConclaveEpoch conclaveEpoch = new(currentEpoch.Number,
        //                                                 currentEpoch.StartTime,
        //                                                 currentEpoch.EndTime, EpochStatus.Current);

        var conclaveEpoch = new ConclaveEpoch
        {
            EpochNumber = currentEpoch.Number,
            StartTime = currentEpoch.StartTime,
            EndTime = currentEpoch.EndTime,
            EpochStatus = EpochStatus.New

        };

        _context.Add(conclaveEpoch);


        foreach (var delegator in currentDelegators)
        {
            // snapshotList.Add(new ConclaveSnapshot(conclaveEpoch,
            //                                             delegator.StakeId,
            //                                             delegator.LovelacesAmount,
            //                                             snapshotPeriod,
            //                                             new DateTime()));

            var snapshot = new ConclaveSnapshot
            {
                ConclaveEpoch = conclaveEpoch,
                StakingId = delegator.StakeId,
                DelegatedAmount = delegator.LovelacesAmount,
                SnapshotPeriod = snapshotPeriod,
                DateCreated = new DateTime()
            };
        }

        await _context.SaveChangesAsync();

        return snapshotList;
    }

}