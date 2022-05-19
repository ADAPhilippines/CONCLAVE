using Conclave.Api.Extensions;
using Conclave.Api.Interfaces.Services;
using Conclave.Api.Services;
using Conclave.Server.Data;
using Conclave.Snapshot.Capture;

IHost host = Host.CreateDefaultBuilder(args)
    .ConfigureServices((hostContext, services) =>
    {
        services.AddNpgsql<ApplicationDbContext>(hostContext.Configuration.GetValue<string>("DatabaseConfig:PostgresSQL"));
        services.AddDbContext<ApplicationDbContext>();
        services.AddHostedService<Worker>();
        services.AddBlockfrostServices(hostContext.Configuration);
        services.AddConclaveApi();
    })
    .Build();

await host.RunAsync();

