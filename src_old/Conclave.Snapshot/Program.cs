using Blockfrost.Api.Extensions;
using Conclave.Api.Extensions;
using Conclave.Api.Options;
using Conclave.Common.Models;
using Conclave.Snapshot;
using Conclave.Snapshot.Handlers;

IHost host = Host.CreateDefaultBuilder(args)
    .ConfigureServices((hostContext, services) =>
    {
        var applicationOptions = new ApplicationOptions()
        {
            IsDevelopment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development",
        };

        ConclaveOptions conclaveOptions;

        // BLOCKFROST CONFIG
        if (applicationOptions.IsDevelopment)
        {
            services.AddBlockfrost("testnet", Environment.GetEnvironmentVariable("BLOCKFROST_TESTNET_PROJECT_ID"));
            conclaveOptions = hostContext.Configuration.GetSection("Conclave_Testnet").Get<ConclaveOptions>();
        }
        else
        {
            services.AddBlockfrost("mainnet", Environment.GetEnvironmentVariable("BLOCKFROST_MAINNET_PROJECT_ID"));
            conclaveOptions = hostContext.Configuration.GetSection("Conclave_Mainnet").Get<ConclaveOptions>();
        }

        // CONCLAVE CONFIG
        services.AddConclaveDb(Environment.GetEnvironmentVariable("CONCLAVE_CONNECTION_STRING") ?? hostContext.Configuration.GetConnectionString("PostgresSQL"))
                .AddHostedService<Worker>()
                .AddConclaveApi(conclaveOptions, applicationOptions);

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

        services.Configure<PoolOwnerRewardOptions>(o =>
        {
            o.PoolOwnerRewardBeforeMilliseconds = (long)TimeSpan.FromHours(1).TotalMilliseconds;
            o.PoolOwnerRewardCompleteAfterMilliseconds = (long)TimeSpan.FromMinutes(10).TotalMilliseconds;
        });

        services.Configure<RewardOptions>(hostContext.Configuration.GetSection("RewardOptions"));
        services.Configure<ConclaveDistributionParameters>(hostContext.Configuration.GetSection("ConclaveDistributionParameters"));
    })
    .Build();

await host.RunAsync();