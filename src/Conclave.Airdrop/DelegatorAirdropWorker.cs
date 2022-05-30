namespace Conclave.Airdrop;

public class DelegatorAirdropWorker : BackgroundService
{
    private readonly ILogger<DelegatorAirdropWorker> _logger;

    public DelegatorAirdropWorker(ILogger<Worker> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("Worker running at: {time}", DateTimeOffset.Now);
            await Task.Delay(1000, stoppingToken);
        }
    }
}
