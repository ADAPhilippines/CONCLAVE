using Conclave.Api.Exceptions;
using Conclave.Api.Interfaces.Services;

namespace Conclave.Snapshot.Capture;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IServiceProvider _provider;

    public bool IsSeeded { get; set; }
    public bool IsReadyForSnapsot { get; set; }

    public Worker(ILogger<Worker> logger, IServiceProvider provider)
    {
        _logger = logger;
        _provider = provider;
    }
    protected async override Task ExecuteAsync(CancellationToken stoppingToken)
    {

        while (!stoppingToken.IsCancellationRequested)
        {
            using var scope = _provider.CreateScope();

            IsSeeded = await IsConclaveEpochSeededAsync(scope);
            if (!IsSeeded) continue;

            IsReadyForSnapsot = await IsConclaveSnapshotReadyForNextCycleAsync(scope);
            if (!IsReadyForSnapsot) continue;

            await AttemptSnapshotAsync(scope);

            _logger.LogInformation("Snapshot worker will re-execute in 60 seconds");
            await Task.Delay(60000, stoppingToken);
        }
    }


    // Helper Methods

    protected async Task<bool> IsConclaveEpochSeededAsync(IServiceScope scope)
    {
        _logger.LogInformation("Executing Snapshot Worker...");
        if (!IsSeeded)
        {
            _logger.LogInformation("Creating Seed Epoch...");
            try
            {
                await scope.ServiceProvider.GetRequiredService<IConclaveEpochsService>().CreateSeedEpochAsync();
                return true;
            }
            catch (SeedEpochAlreadyCreatedException e)
            {
                _logger.LogError(e.Message);
                return true;
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message);
                return false;
            }
        }
        return IsSeeded;
    }

    protected async Task<bool> IsConclaveSnapshotReadyForNextCycleAsync(IServiceScope scope)
    {
        if (!IsReadyForSnapsot)
        {
            _logger.LogInformation("Preparing Next Snapshot Cycle...");
            try
            {
                await scope.ServiceProvider.GetRequiredService<IConclaveSnapshotService>().PrepareNextSnapshotCycleAsync();
                return true;
            }
            catch (Exception e)
            {
                _logger.LogError(e.Message);
                return false;
            }
        }
        return IsReadyForSnapsot;
    }

    protected async Task AttemptSnapshotAsync(IServiceScope scope)
    {
        _logger.LogInformation("Attempting to capture snapshot...");
        try
        {
            await scope.ServiceProvider.GetRequiredService<IConclaveSnapshotService>().SnapshotPoolsAsync();
        }
        catch (Exception e)
        {
            _logger.LogError(e.Message);
        }
    }
}