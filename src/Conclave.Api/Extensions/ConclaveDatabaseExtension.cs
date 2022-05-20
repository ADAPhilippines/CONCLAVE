using Conclave.Data;

namespace Conclave.Api.Extensions;

public static class ConclaveDatabaseExtension
{

    public static IServiceCollection AddConclaveDb(this IServiceCollection services, IConfiguration config)
    {
        services.AddNpgsql<ApplicationDbContext>(config.GetValue<string>("DatabaseConfig:PostgresSQL"));
        services.AddDbContext<ApplicationDbContext>();
        return services;
    }
}