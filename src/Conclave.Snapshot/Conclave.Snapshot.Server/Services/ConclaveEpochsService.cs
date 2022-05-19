using Blockfrost.Api.Services;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Conclave.Snapshot.Server.Data;
using Conclave.Snapshot.Server.Exceptions;
using Conclave.Snapshot.Server.Interfaces.Services;

namespace Conclave.Snapshot.Server.Services;


public class ConclaveEpochsService : IConclaveEpochsService
{
    private readonly IEpochsService _service;
    private readonly ApplicationDbContext _context;

    public ConclaveEpochsService(IEpochsService service, ApplicationDbContext context)
    {
        _service = service;
        _context = context;
    }

    public async Task<ConclaveEpoch> CreateSeedEpochAsync()
    {
        var seedEpoch = _context.ConclaveEpochs
                        .Where(e => e.EpochStatus == EpochStatus.Seed)
                        .FirstOrDefault();

        if (seedEpoch is not null) throw new SeedEpochAlreadyCreatedException();

        var currentEpoch = await GetCurrentEpochAsync();

        seedEpoch = new ConclaveEpoch
        {
            EpochNumber = currentEpoch.Number,
            StartTime = currentEpoch.StartTime,
            EndTime = currentEpoch.EndTime,
            EpochStatus = EpochStatus.Seed,
            SnapshotStatus = SnapshotStatus.Skip,
            RewardStatus = RewardStatus.Skip,
            AirdropStatus = AirdropStatus.Skip
        };


        // should be in action method function
        _context.Add(seedEpoch);
        await _context.SaveChangesAsync();

        return seedEpoch;
    }

    public List<ConclaveEpoch> GetConclaveEpochsByEpochStatus(EpochStatus status)
    {
        var epochs = _context.ConclaveEpochs.Where(e => e.EpochStatus == status).ToList();
        return epochs;
    }

    public async Task<Epoch> GetCurrentEpochAsync()
    {
        var currentEpoch = await _service.GetLatestAsync();

        // check for errors before mapping

        return new Epoch(currentEpoch.Epoch,
        DateUtils.UnixTimeStampToDateTime(currentEpoch.StartTime),
        DateUtils.UnixTimeStampToDateTime(currentEpoch.EndTime));
    }
}
