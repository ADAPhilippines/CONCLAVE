using Conclave.SRS.Services;

namespace Conclave.SRS;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly FakeSnapshotService _fakeSnapshotService;

    public Worker(ILogger<Worker> logger, FakeSnapshotService fakeSnapshotService)
    {
        _logger = logger;
        _fakeSnapshotService = fakeSnapshotService;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("Worker running at: {time}", DateTimeOffset.Now);
            // Fake Computations
            var fakeData = await _fakeSnapshotService.GetDataAsync();
            await _fakeSnapshotService.SaveDataAsync(fakeData);
            _logger.LogInformation("FakeData Count: {count}", await _fakeSnapshotService.GetCountAsync());
            await Task.Delay(1000, stoppingToken);
        }
    }
}
