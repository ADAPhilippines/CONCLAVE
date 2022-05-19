using Conclave.Snapshot.Capture.Interfaces.Services;
using Conclave.Snapshot.Capture.Services;

namespace Conclave.Snapshot.Capture.Extensions;

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