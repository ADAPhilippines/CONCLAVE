using Conclave.Reward;

using Blockfrost.Api.Extensions;
using Conclave.Api.Extensions;
using Conclave.Api.Options;

IHost host = Host.CreateDefaultBuilder(args)
    .ConfigureServices((hostContext, services) =>
    {
        var conclaveOptions = hostContext.Configuration.GetSection("Conclave").Get<ConclaveOptions>();

        services.AddConclaveDb(hostContext.Configuration.GetConnectionString("PostgresSQL"))
                .AddHostedService<Worker>()
                .AddBlockfrost(hostContext.Configuration.GetValue<string>("Blockfrost:Network"),
                               hostContext.Configuration.GetValue<string>("Blockfrost:ProjectId"))
                .AddConclaveApi(conclaveOptions);

        // services.Configure<SnapshotOptions>(o =>
        // {
        //     o.SnapshotBeforeMilliseconds = (long)TimeSpan.FromHours(1).TotalMilliseconds;
        //     o.SnapshotCompleteAfterMilliseconds = (long)TimeSpan.FromMinutes(10).TotalMilliseconds;
        // });
    })
    .Build();

await host.RunAsync();
