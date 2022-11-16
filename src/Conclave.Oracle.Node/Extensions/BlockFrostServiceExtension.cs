using Conclave.Oracle.Node.Services;
using Blockfrost.Api;
using Blockfrost.Api.Extensions;

namespace Conclave.Oracle.Node.Extensions;

public static class BlockFrostServiceExtension
{
    public static IServiceCollection AddCardanoService(this IServiceCollection serviceCollection, string network, string apiKey)
    {
        serviceCollection.AddBlockfrost(network, apiKey);
        serviceCollection.AddSingleton<CardanoServices>((serviceProvider) =>
        {
            IBlockService blockService = serviceProvider.GetRequiredService<IBlockService>();
            CardanoServices blockFrostService;
            ILogger<CardanoServices> logger = serviceProvider.GetRequiredService<ILogger<CardanoServices>>();
            IHostApplicationLifetime hostApplicationLifetime = serviceProvider.GetRequiredService<IHostApplicationLifetime>();

            blockFrostService = new CardanoServices(blockService, logger, hostApplicationLifetime);
            return blockFrostService;
        });

        return serviceCollection;
    }
}