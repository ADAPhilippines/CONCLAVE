using Conclave.Snapshot.Server.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddNpgsql<ApplicationDbContext>(builder.Configuration.GetValue<string>("DatabaseConfig:PostgresSQL"));

var app = builder.Build();

app.MapGet("/", () => "Hello World!");

app.Run();
