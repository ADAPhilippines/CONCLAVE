using Conclave.Snapshot.Server.Interfaces.Services;
using Conclave.Snapshot.Server.Services;

namespace Conclave.Snapshot.Server.Extensions;

public static class ConclaveCardanoServicesExtension
{

    public static IServiceCollection AddConclaveCardano(this IServiceCollection services)
    {
        services.AddScoped<IConclavePoolsService, ConclavePoolsService>();
        services.AddScoped<IConclaveEpochsService, ConclaveEpochsService>();
        services.AddScoped<IConclaveSnapshotService, ConclaveSnapshotService>();
        return services;
    }
}