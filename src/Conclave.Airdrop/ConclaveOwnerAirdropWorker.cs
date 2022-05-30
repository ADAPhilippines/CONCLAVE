namespace Conclave.Airdrop;

public class ConclaveOwnerAirdropWorker : BackgroundService
{
    private readonly ILogger<ConclaveOwnerAirdropWorker> _logger;

    public ConclaveOwnerAirdropWorker(ILogger<ConclaveOwnerAirdropWorker> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("Worker running at: {time}", DateTimeOffset.Now);






            await Task.Delay(1000, stoppingToken); // restart in 1 day
        }
    }
}
