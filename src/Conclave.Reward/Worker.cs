namespace Conclave.Reward;

public class Worker : BackgroundService
{
    private readonly ILogger<Worker> _logger;
    private ConclaveEpoch CurrentEpoch { get; set; }

    // services
    private IConclaveEpochsService EpochsService { get; set; }

    public Worker(ILogger<Worker> logger, IServiceProvider provider)
    {
        _logger = logger;
        var scopedProvider = _provider.CreateScope().ServiceProvider;

        EpochsService = scopedProvider.GetService<IConclaveEpochsService>();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {

            await Task.Delay(9000000000);
        }
    }


    private async Task ExecuteCurrentEpochSetter()
    {
        //  CurrentEpoch = await EpochsService.
    }

    private async Task ExecuteConclaveHolderRewardCalulation()
    {

    }
}
