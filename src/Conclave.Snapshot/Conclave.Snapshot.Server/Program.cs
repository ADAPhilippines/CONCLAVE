using Conclave.Snapshot.Server.Data;
using Conclave.Snapshot.Server.Extensions;
using Conclave.Snapshot.Server.Interfaces.Services;
using Conclave.Snapshot.Server.Services;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddNpgsql<ApplicationDbContext>(builder.Configuration.GetValue<string>("DatabaseConfig:PostgresSQL"));
builder.Services.AddHttpClient();
builder.Services.AddConclaveBlockfrost(builder.Configuration);
builder.Services.AddConclaveCardano();

var app = builder.Build();

// app.MapGet("/", async (IConclaveEpochsService conclaveEpochsService) =>
// {
//     var poolId = builder.Configuration.GetValue<string>("Blockfrost:AdaPhPoolID");
//     // await service.GetPoolDelegatorsAsync(builder.Configuration.GetValue<string>("Blockfrost:AdaPhPoolID"));
//     await conclaveEpochsService.GetCurrentEpoch(poolId);
//     return "done";
// });


app.MapGet("/", async (IConclaveSnapshotService service) =>
{
    await service.SnapshotPoolsAsync();
    return "done";
});

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
