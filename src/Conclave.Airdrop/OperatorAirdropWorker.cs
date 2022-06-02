namespace Conclave.Airdrop;

public class OperatorAirdropWorker : BackgroundService
{
    private readonly ILogger<OperatorAirdropWorker> _logger;

    public OperatorAirdropWorker(ILogger<OperatorAirdropWorker> logger)
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
