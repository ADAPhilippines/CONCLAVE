using Conclave.Api.Extensions;
using Conclave.Server.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddNpgsql<ApplicationDbContext>(builder.Configuration.GetValue<string>("DatabaseConfig:PostgresSQL"));
builder.Services.AddDbContext<ApplicationDbContext>();
builder.Services.AddBlockfrostServices(builder.Configuration);
builder.Services.AddConclaveApi();

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

// app.UseAuthorization();

app.MapControllers();

app.Run();
