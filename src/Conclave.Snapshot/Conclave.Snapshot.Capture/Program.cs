using Conclave.Api.Extensions;
using Conclave.Api.Interfaces.Services;
using Conclave.Api.Services;
using Conclave.Server.Data;
using Conclave.Snapshot.Capture;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddNpgsql<ApplicationDbContext>(builder.Configuration.GetValue<string>("DatabaseConfig:PostgresSQL"));
builder.Services.AddDbContext<ApplicationDbContext>();
builder.Services.AddHostedService<Worker>();
builder.Services.AddBlockfrostServices(builder.Configuration);
builder.Services.AddConclaveApi();

var app = builder.Build();

// app.MapGet("/", async (IConclaveEpochsService conclaveEpochsService) =>
// {
//     var poolId = builder.Configuration.GetValue<string>("Blockfrost:AdaPhPoolID");
//     // await service.GetPoolDelegatorsAsync(builder.Configuration.GetValue<string>("Blockfrost:AdaPhPoolID"));
//     await conclaveEpochsService.GetCurrentEpoch(poolId);
//     return "done";
// });


// app.MapGet("/", async (IConclaveSnapshotService service) =>
// {
//     await service.SnapshotPoolsAsync();
//     return "done";
// });

// app.MapGet("/", async (IConclaveSnapshotService service) =>
// {
//     await service.PrepareNextSnapshotCycleAsync();
//     return "done";
// });


// app.MapGet("/", async (IConclaveEpochsService service) =>
// {
//     await service.CreateSeedEpochAsync();
//     return "done";
// });

app.Run();
