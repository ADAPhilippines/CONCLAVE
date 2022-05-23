using Conclave.Api.Interfaces.Services;
using Conclave.Api.Options;
using Conclave.Api.Services;

namespace Conclave.Api.Extensions;

public static class ConclaveCardanoServicesExtension
{

    public static IServiceCollection AddConclaveApi(this IServiceCollection services, IConfiguration config)
    {
        services.AddScoped<IConclaveCardanoService, ConclaveBlockfrostCardanoService>();
        services.AddScoped<IConclaveEpochsService, ConclaveEpochsService>();
        services.AddScoped<IConclaveSnapshotService, ConclaveSnapshotService>();
        services.AddScoped<IConclaveSnapshotWorkerService, ConclaveSnapshotWorkerService>();
        services.AddScoped<IConclaveSnapshotSchedulerService, ConclaveSnapshotSchedulerService>();
        services.AddScoped<IConclaveEpochDelegatorService, ConclaveEpochDelegatorService>();
        services.AddScoped<IConclaveEpochDelegatorWorkerService, ConclaveEpochDelegatorWorkerService>();
        services.Configure<ConclaveCardanoOptions>(config);
        return services;
    }
}