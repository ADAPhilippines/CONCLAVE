using Conclave.Api.Interfaces;
using Conclave.Api.Options;
using Conclave.Api.Services;
using Conclave.Common.Models;

namespace Conclave.Api.Extensions;

public static class ConclaveCardanoServicesExtension
{

    public static IServiceCollection AddConclaveApi(this IServiceCollection services, ConclaveOptions options)
    {

        services.AddScoped<IConclaveCardanoService, ConclaveBlockfrostCardanoService>();
        services.AddScoped<IConclaveEpochsService, ConclaveEpochsService>();
        services.AddScoped<IConclaveSnapshotService, ConclaveSnapshotService>();
        services.AddScoped<IDelegatorSnapshotService, DelegatorSnapshotService>();
        services.AddScoped<IOperatorSnapshotService, OperatorSnapshotService>();
        services.AddScoped<IConclaveOwnerSnapshotService, ConclaveOwnerSnapshotService>();
        services.AddScoped<IConclaveSnapshotSchedulerService, ConclaveSnapshotSchedulerService>();

        services.Configure<ConclaveOptions>(o =>
        {
            o.PoolIds = options.PoolIds;
            o.ConclaveAddress = options.ConclaveAddress;
        });

        return services;
    }
}