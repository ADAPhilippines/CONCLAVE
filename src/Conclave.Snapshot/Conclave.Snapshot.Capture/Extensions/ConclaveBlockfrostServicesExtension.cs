using Blockfrost.Api.Extensions;
using Blockfrost.Api.Models.Extensions;
using Blockfrost.Api.Options;
using Blockfrost.Api.Services;
using Blockfrost.Api.Services.Extensions;
using CardanoSharp.Wallet;
using Conclave.Snapshot.Capture.Interfaces.Services;
using Conclave.Snapshot.Capture.Options;
using Microsoft.Extensions.Options;

namespace Conclave.Snapshot.Capture.Extensions;
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