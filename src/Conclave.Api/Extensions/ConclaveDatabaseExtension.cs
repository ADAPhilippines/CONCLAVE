using Conclave.Data;

namespace Conclave.Api.Extensions;

public static class ConclaveDatabaseExtension
{

    public static IServiceCollection AddConclaveDb(this IServiceCollection services, string connectionString)
    {
        services.AddNpgsql<ApplicationDbContext>(connectionString)
                .AddDbContext<ApplicationDbContext>();

        return services;
    }
}