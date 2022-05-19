using Conclave.Api.Interfaces.Services;
using Conclave.Api.Services;

namespace Conclave.Api.Extensions;

public static class ConclaveCardanoServicesExtension
{

    public static IServiceCollection AddConclaveApi(this IServiceCollection services)
    {
        services.AddScoped<IConclavePoolsService, ConclavePoolsService>();
        services.AddScoped<IConclaveEpochsService, ConclaveEpochsService>();
        services.AddScoped<IConclaveSnapshotService, ConclaveSnapshotService>();
        return services;
    }
}