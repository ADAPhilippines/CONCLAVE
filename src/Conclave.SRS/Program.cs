using Conclave.Data;
using Conclave.SRS;
using Conclave.SRS.Services;
using Microsoft.EntityFrameworkCore;

IHost host = Host.CreateDefaultBuilder(args)
    .ConfigureServices((hostContext, services) =>
    {
        services.AddHostedService<Worker>();
        services.AddDbContext<ConclaveCoreDbContext>(options => options.UseSqlite(hostContext.Configuration.GetConnectionString("ConclaveCore")), ServiceLifetime.Singleton);
        services.AddSingleton<FakeSnapshotService>();
    })
    .Build();


await host.RunAsync();
