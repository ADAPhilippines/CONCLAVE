using Conclave.Snapshot.Server.Interfaces.Services;
using Conclave.Snapshot.Server.Services;

namespace Conclave.Snapshot.Server.Extensions;

public static class ConclavePoolsServicesExtension
{

    public static IServiceCollection AddConclaveCardano(this IServiceCollection services)
    {
        services.AddSingleton<IConclavePoolsService, ConclavePoolsService>();
        services.AddSingleton<IConclaveEpochsService, ConclaveEpochsService>();
        return services;
    }
}