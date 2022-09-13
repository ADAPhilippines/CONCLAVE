using Blockfrost.Api.Extensions;
using Conclave.Api.Extensions;
using Conclave.Api.Options;

var builder = WebApplication.CreateBuilder(args);


var conclaveOptions = builder.Configuration.GetSection("Conclave").Get<ConclaveOptions>();
var applicationOptions = new ApplicationOptions()
{
    IsDevelopment = builder.Environment.IsDevelopment()
};

// Add services to the container.
builder.Services.AddConclaveDb(builder.Configuration.GetConnectionString("PostgresSQL"))
                .AddConclaveApi(conclaveOptions, applicationOptions)
                .AddControllers();

var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";
builder.Services.AddCors(o =>
{
    o.AddPolicy(name: MyAllowSpecificOrigins,
    policy =>
    {
        policy.WithOrigins(Environment.GetEnvironmentVariable("CONCLAVE_DASHBOARD_ORIGIN_URL") ?? "");
    });
});

// BLOCKFROST CONFIG
if (applicationOptions.IsDevelopment)
{
    builder.Services.AddBlockfrost("testnet", Environment.GetEnvironmentVariable("BLOCKFROST_TESTNET_PROJECT_ID"));
}
else
{
    builder.Services.AddBlockfrost("mainnet", Environment.GetEnvironmentVariable("BLOCKFROST_MAINNET_PROJECT_ID"));
}

//Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

//Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseExceptionHandler(); // 500 - Internal Server Error

app.UseHttpsRedirection();

app.UseCors();

app.UseAuthorization();

app.MapControllers();

app.Run();
