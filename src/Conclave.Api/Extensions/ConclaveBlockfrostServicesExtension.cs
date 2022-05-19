using Blockfrost.Api.Extensions;
using Blockfrost.Api.Models.Extensions;
using Blockfrost.Api.Options;
using Blockfrost.Api.Services;
using Blockfrost.Api.Services.Extensions;
using CardanoSharp.Wallet;
using Conclave.Api.Interfaces.Services;
using Conclave.Api.Options;
using Microsoft.Extensions.Options;

namespace Conclave.Api.Extensions;
public static class ConclaveBlockfrostServicesExtension
{

    public static IServiceCollection AddBlockfrostServices(this IServiceCollection services, IConfiguration config)
    {

        services.AddBlockfrost(
            config.GetValue<string>("Blockfrost:Network"),
            config.GetValue<string>("Blockfrost:ProjectId"));

        services.Configure<ConclaveCardanoOptions>(config.GetSection("Conclave"));

        return services;
    }
}