using Conclave.Api.Interfaces;
using Conclave.Api.Options;
using Conclave.Api.Services;
using Conclave.Common.Models;

namespace Conclave.Api.Extensions;

public static class ConclaveCardanoServicesExtension
{

    public static IServiceCollection AddConclaveApi(this IServiceCollection services, ConclaveOptions conclaveOptions, ApplicationOptions applicationOptions)
    {

        // General
        services.AddScoped<IConclaveCardanoService, ConclaveBlockfrostCardanoService>();
        services.AddScoped<IConclaveEpochsService, ConclaveEpochsService>();
        services.AddScoped<INFTGroupService, NFTGroupService>();
        services.AddScoped<INFTProjectService, NFTProjectService>();
        services.AddScoped<IConclaveSchedulerService, ConclaveSnapshotSchedulerService>();

        // Snapshot
        services.AddScoped<IConclaveSnapshotService, ConclaveSnapshotService>();
        services.AddScoped<IDelegatorSnapshotService, DelegatorSnapshotService>();
        services.AddScoped<IOperatorSnapshotService, OperatorSnapshotService>();
        services.AddScoped<INFTSnapshotService, NFTSnapshotService>();
        services.AddScoped<IConclaveOwnerSnapshotService, ConclaveOwnerSnapshotService>();

        // Reward
        services.AddScoped<IConclaveRewardService, ConclaveRewardService>();
        services.AddScoped<IDelegatorRewardService, DelegatorRewardService>();
        services.AddScoped<IOperatorRewardService, OperatorRewardService>();
        services.AddScoped<INFTRewardService, NFTRewardService>();
        services.AddScoped<IConclaveOwnerRewardService, ConclaveOwnerRewardService>();


        services.Configure<ConclaveOptions>(o =>
        {
            o.PoolIds = conclaveOptions.PoolIds;
            o.ConclaveAddress = conclaveOptions.ConclaveAddress;
        });

        services.Configure<ApplicationOptions>(o =>
        {
            o.IsDevelopment = applicationOptions.IsDevelopment;
        });

        return services;
    }
}