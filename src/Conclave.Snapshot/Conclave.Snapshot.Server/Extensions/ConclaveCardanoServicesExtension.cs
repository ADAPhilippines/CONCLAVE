namespace Conclave.Snapshot.Server.Extensions;
using Blockfrost.Api.Extensions;
using Blockfrost.Api.Models.Extensions;
using Blockfrost.Api.Services;
using Blockfrost.Api.Services.Extensions;
using CardanoSharp.Wallet;
using Conclave.Snapshot.Server.Interfaces.Services;
using Microsoft.Extensions.Options;

public static class ConclaveCardanoServicesExtension
{

    public static IServiceCollection AddConclaveBlockfrost(this IServiceCollection services, IConfiguration config)
    {

        var provider = services.AddBlockfrost(
            config.GetValue<string>("Blockfrost:Network"),
             config.GetValue<string>("Blockfrost:ProjectId"))
                     .BuildServiceProvider();
        provider.GetRequiredService<IPoolsService>();
        provider.GetRequiredService<IPoolsService>();
        provider.GetRequiredService<IEpochsService>();

        return services;
    }
}