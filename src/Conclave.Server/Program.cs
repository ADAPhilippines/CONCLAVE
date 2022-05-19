using Conclave.Server.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddNpgsql<ApplicationDbContext>(builder.Configuration.GetValue<string>("DatabaseConfig:PostgresSQL"));
builder.Services.AddDbContext<ApplicationDbContext>();

var app = builder.Build();

app.Run();
