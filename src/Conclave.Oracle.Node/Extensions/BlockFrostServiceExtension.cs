using Conclave.Oracle.Node.Services;
using Blockfrost.Api;
using Blockfrost.Api.Extensions;

namespace Conclave.Oracle.Node.Extensions;

public static class BlockFrostServiceExtension
{
    public static IServiceCollection AddBlockFrostService(this IServiceCollection serviceCollection, string network, string apiKey)
    {
        serviceCollection.AddBlockfrost(network, apiKey);
        serviceCollection.AddSingleton<CardanoServices>((serviceProvider) =>
        {
            var blockService = serviceProvider.GetRequiredService<IBlockService>();

            CardanoServices blockFrostService;
            ILogger<CardanoServices>? logger = null;
            blockFrostService = new CardanoServices(blockService, logger!);
            return blockFrostService;
        });
        
        return serviceCollection;
    }
}