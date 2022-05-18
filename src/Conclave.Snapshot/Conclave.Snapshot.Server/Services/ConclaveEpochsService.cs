using Blockfrost.Api.Services;
using Conclave.Snapshot.Server.Data;
using Conclave.Snapshot.Server.Enums;
using Conclave.Snapshot.Server.Interfaces.Services;
using Conclave.Snapshot.Server.Models;
using Conclave.Snapshot.Server.Utils;

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
                        .Where(e => e.EpochStatus == Enums.EpochStatus.Seed)
                        .FirstOrDefault();

        if (seedEpoch is not null) throw new Exception("Seed epoch already created!");

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

    public async Task<Epoch> GetCurrentEpochAsync()
    {
        var currentEpoch = await _service.GetLatestAsync();

        // check for errors before mapping

        return new Epoch(currentEpoch.Epoch,
        DateUtils.UnixTimeStampToDateTime(currentEpoch.StartTime),
        DateUtils.UnixTimeStampToDateTime(currentEpoch.EndTime));
    }
}
