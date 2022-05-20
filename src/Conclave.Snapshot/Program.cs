using Conclave.Api.Extensions;
using Conclave.Snapshot;

IHost host = Host.CreateDefaultBuilder(args)
    .ConfigureServices((hostContext, services) =>
    {
        services.AddConclaveDb(hostContext.Configuration);
        services.AddHostedService<Worker>();
        services.AddBlockfrostServices(hostContext.Configuration);
        services.AddConclaveApi();
    })
    .Build();

await host.RunAsync();