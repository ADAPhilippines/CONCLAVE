using Conclave.Airdrop;

IHost host = Host.CreateDefaultBuilder(args)
    .ConfigureServices(services =>
    {
        services.AddHostedService<DelegatorAirdropWorker>();
        services.AddHostedService<NFTAirdropWorker>();
        services.AddHostedService<OperatorAirdropWorker>();
        services.AddHostedService<ConclaveOwnerAirdropWorker>();
    })
    .Build();

await host.RunAsync();
