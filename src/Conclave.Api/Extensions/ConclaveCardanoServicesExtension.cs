using Conclave.Api.Interfaces.Services;
using Conclave.Api.Options;
using Conclave.Api.Services;

namespace Conclave.Api.Extensions;

public static class ConclaveCardanoServicesExtension
{

    public static IServiceCollection AddConclaveApi(this IServiceCollection services, ConclaveOptions options)
    {
        services.AddScoped<IConclaveCardanoService, ConclaveBlockfrostCardanoService>(); 
        services.AddScoped<IConclaveEpochsService, ConclaveEpochsService>();
        services.AddScoped<IConclaveSnapshotService, ConclaveSnapshotService>();
        services.AddScoped<IConclaveSnapshotWorkerService, ConclaveSnapshotWorkerService>();
        services.AddScoped<IConclaveSnapshotSchedulerService, ConclaveSnapshotSchedulerService>();
        services.AddScoped<IConclaveEpochDelegatorService, ConclaveEpochDelegatorService>();
        services.AddScoped<IConclaveEpochDelegatorWorkerService, ConclaveEpochDelegatorWorkerService>();
        services.AddScoped<IConclaveEpochDelegatorRewardService, ConclaveEpochDelegatorRewardService>();
        services.AddScoped<IConclaveRewardCalculationService, ConclaveRewardCalculationService>();
        services.AddScoped<IConclaveEpochRewardService, ConclaveEpochRewardService>();

        services.Configure<ConclaveOptions>(o =>
        {
            o.PoolIds = options.PoolIds;
            o.ConclaveAddress = options.ConclaveAddress;
        });

        return services;
    }
}