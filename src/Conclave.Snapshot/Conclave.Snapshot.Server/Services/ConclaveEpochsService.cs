using Blockfrost.Api.Services;
using Conclave.Snapshot.Server.Interfaces.Services;
using Conclave.Snapshot.Server.Models;

namespace Conclave.Snapshot.Server.Services;


public class ConclaveEpochsService : IConclaveEpochsService
{
    private readonly IEpochsService _service;

    public ConclaveEpochsService(IEpochsService service)
    {
        _service = service;
    }

    public async Task<Epoch> GetCurrentEpochAsync(string poolId)
    {
        var currentEpoch = await _service.GetLatestAsync();

        // check for errors before mapping

        return new Epoch(currentEpoch.Epoch, new DateTime(currentEpoch.StartTime), new DateTime(currentEpoch.EndTime));
    }
}
