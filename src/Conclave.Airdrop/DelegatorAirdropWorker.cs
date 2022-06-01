using Conclave.Airdrop.Handlers;

namespace Conclave.Airdrop;

public class DelegatorAirdropWorker : BackgroundService
{
    private readonly ILogger<DelegatorAirdropWorker> _logger;
    private readonly DelegatorAirdropHandler _handler;

    public DelegatorAirdropWorker(ILogger<DelegatorAirdropWorker> logger,
                                  DelegatorAirdropHandler handler)
    {
        _logger = logger;
        _handler = handler;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("Worker running at: {time}", DateTimeOffset.Now);

            try
            {
                await _handler.HandleAsync();
            }
            catch (Exception ex)
            {
                _logger.LogCritical(ex, "Error in DelegatorAirdropWorker");

                // TODO: notify devs of error

                await Task.Delay(60 * 60 * 1000, stoppingToken); // wait 1 hour or some hour to fix the issue
            }

            await Task.Delay(60 * 60 * 24 * 1000, stoppingToken); // re-check every 24 hours
        }
    }
}
