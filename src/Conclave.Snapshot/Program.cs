using Blockfrost.Api.Extensions;
using Conclave.Api.Extensions;
using Conclave.Api.Options;
using Conclave.Snapshot;
using Conclave.Snapshot.Handlers;

IHost host = Host.CreateDefaultBuilder(args)
    .ConfigureServices((hostContext, services) =>
    {
        var conclaveOptions = hostContext.Configuration.GetSection("Conclave").Get<ConclaveOptions>();

        services.AddConclaveDb(hostContext.Configuration.GetConnectionString("PostgresSQL"))
                .AddHostedService<Worker>()
                .AddBlockfrost(hostContext.Configuration.GetValue<string>("Blockfrost:Network"),
                                hostContext.Configuration.GetValue<string>("Blockfrost:ProjectId"))
                .AddConclaveApi(conclaveOptions);

        // Snapshot
        services.AddScoped<DelegatorSnapshotHandler>();
        services.AddScoped<OperatorSnapshotHandler>();
        services.AddScoped<NFTSnapshotHandler>();
        services.AddScoped<ConclaveOwnerSnapshotHandler>();

        // Reward
        services.AddScoped<DelegatorRewardHandler>();
        services.AddScoped<OperatorRewardHandler>();
        services.AddScoped<NFTRewardHandler>();
        services.AddScoped<ConclaveOwnerRewardHandler>();

        services.Configure<SnapshotOptions>(o =>
        {
            o.SnapshotBeforeMilliseconds = (long)TimeSpan.FromHours(1).TotalMilliseconds;
            o.SnapshotCompleteAfterMilliseconds = (long)TimeSpan.FromMinutes(10).TotalMilliseconds;
        });

        services.Configure<RewardOptions>(hostContext.Configuration.GetSection("RewardOptions"));
    })
    .Build();

await host.RunAsync();