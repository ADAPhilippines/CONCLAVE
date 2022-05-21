using Conclave.Api.Interfaces.Services;
using Conclave.Api.Services;

namespace Conclave.Api.Extensions;

public static class ConclaveCardanoServicesExtension
{

    public static IServiceCollection AddConclaveApi(this IServiceCollection services)
    {
        services.AddScoped<IConclaveCardanoService, ConclaveBlockfrostCardanoService>();
        services.AddScoped<IConclaveEpochsService, ConclaveEpochsService>();
        services.AddScoped<IConclaveSnapshotService, ConclaveSnapshotService>();
        services.AddScoped<IConclaveSnapshotWorkerService, ConclaveSnapshotWorkerService>();
        services.AddScoped<IConclaveSnapshotSchedulerService, ConclaveSnapshotSchedulerService>();
        return services;
    }
}