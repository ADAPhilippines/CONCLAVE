namespace Conclave.Snapshot.Server.Extensions;
using Blockfrost.Api.Extensions;
using Blockfrost.Api.Models.Extensions;
using Blockfrost.Api.Options;
using Blockfrost.Api.Services;
using Blockfrost.Api.Services.Extensions;
using CardanoSharp.Wallet;
using Conclave.Server.Options;
using Conclave.Snapshot.Server.Interfaces.Services;
using Microsoft.Extensions.Options;

public static class ConclaveBlockfrostServicesExtension
{

    public static IServiceCollection AddConclaveBlockfrost(this IServiceCollection services, IConfiguration config)
    {

        services.AddBlockfrost(
            config.GetValue<string>("Blockfrost:Network"),
            config.GetValue<string>("Blockfrost:ProjectId"));

        services.Configure<ConclaveCardanoOptions>(config.GetSection("Conclave"));

        return services;
    }
}