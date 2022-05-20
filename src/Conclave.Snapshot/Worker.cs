using System;
using System.Threading.Tasks;
using Conclave.Api.Exceptions;
using Conclave.Api.Interfaces.Services;
using Conclave.Common.Enums;
using Conclave.Common.Models;

namespace Conclave.Snapshot;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private readonly IServiceProvider _provider;

    public bool IsSeeded { get; set; }
    public bool IsReadyForSnapshot { get; set; }
    public ConclaveEpoch? CurrentConclaveEpoch { get; set; }

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

            if (!IsSeeded) throw new SeedEpochNotYetCreatedException();

            if (CurrentConclaveEpoch is null)
                CurrentConclaveEpoch = GetCurrentConclaveEpoch(scope);

            IsReadyForSnapshot = await IsConclaveSnapshotReadyForNextCycleAsync(scope); // 

            if (!IsReadyForSnapshot)
            {
                // delay until next conclave epoch creation
                // 
                await Task.Delay(60000, stoppingToken);
                continue;
            };

            await AttemptSnapshotAsync(scope); // 
            await Task.Delay(640000, stoppingToken);
            _logger.LogInformation("Snapshot worker will re-execute in a few minutes");

        }
    }

    // Helper Methods

    private async Task<bool> IsConclaveEpochSeededAsync(IServiceScope scope)
    {
        _logger.LogInformation("Executing Snapshot Worker...");
        if (!IsSeeded)
        {
            _logger.LogInformation("Creating Seed Epoch...");
            try
            {
                // extract this 
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

    private async Task<bool> IsConclaveSnapshotReadyForNextCycleAsync(IServiceScope scope)
    {
        if (!IsReadyForSnapshot)
        {
            _logger.LogInformation("Preparing Next Snapshot Cycle...");
            try
            {
                await scope.ServiceProvider.GetRequiredService<IConclaveSnapshotService>().PrepareNextSnapshotCycleAsync();
                return true;
            }
            catch (NewConclaveEpochAlreadyCreatedException e)
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
        return IsReadyForSnapshot;
    }

    private async Task AttemptSnapshotAsync(IServiceScope scope)
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

    private int GetSnapshotDelayInSeconds(SnapshotPeriod period, ConclaveEpoch currentEpoch)
    {
        throw new NotImplementedException();
    }

    private ConclaveEpoch? GetCurrentConclaveEpoch(IServiceScope scope)
    {
        if (!IsSeeded) throw new SeedEpochNotYetCreatedException();
        var service = scope.ServiceProvider.GetRequiredService<IConclaveEpochsService>();
        var currentEpoch = service.GetConclaveEpochsByEpochStatus(EpochStatus.Current)
                                                 .FirstOrDefault();

        return currentEpoch ?? service.GetConclaveEpochsByEpochStatus(EpochStatus.Seed)
                                              .FirstOrDefault();
    }
}