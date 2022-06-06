namespace Conclave.Airdrop;

public class NFTAirdropWorker : BackgroundService
{
    private readonly ILogger<NFTAirdropWorker> _logger;

    public NFTAirdropWorker(ILogger<NFTAirdropWorker> logger)
    {
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("Worker running at: {time}", DateTimeOffset.Now);

            //TODO: Get all unpaid nft rewards



            await Task.Delay(1000, stoppingToken);
        }
    }
}