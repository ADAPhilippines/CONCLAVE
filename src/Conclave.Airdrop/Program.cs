using Blockfrost.Api.Extensions;
using Conclave.Airdrop;
using Conclave.Airdrop.Handlers;
using Conclave.Api.Extensions;
using Conclave.Api.Options;

IHost host = Host.CreateDefaultBuilder(args)
    .ConfigureServices((hostContext, services) =>
    {
        // services
        services.AddHostedService<DelegatorAirdropWorker>()
                .AddHostedService<NFTAirdropWorker>()
                .AddHostedService<OperatorAirdropWorker>()
                .AddHostedService<ConclaveOwnerAirdropWorker>()
                .AddConclaveDb(hostContext.Configuration.GetConnectionString("PostgresSQL"))
                .AddBlockfrost(hostContext.Configuration.GetValue<string>("Blockfrost:Network"),
                               hostContext.Configuration.GetValue<string>("Blockfrost:ProjectId"));

        // options
        services.Configure<AirdropOptions>(hostContext.Configuration.GetSection("Airdrop"));

        // handlers
        services.AddScoped<DelegatorAirdropHandler>();

    })
    .Build();

await host.RunAsync();
