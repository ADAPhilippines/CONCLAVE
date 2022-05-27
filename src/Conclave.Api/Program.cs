using Blockfrost.Api.Extensions;
using Conclave.Api.Extensions;
using Conclave.Api.Options;

var builder = WebApplication.CreateBuilder(args);


var conclaveOptions = builder.Configuration.GetSection("Conclave").Get<ConclaveOptions>();

// Add services to the container.
builder.Services.AddConclaveDb(builder.Configuration.GetConnectionString("PostgresSQL"))
                .AddBlockfrost(builder.Configuration.GetValue<string>("Blockfrost:Network"), builder.Configuration.GetValue<string>("Blockfrost:ProjectId"))
                .AddConclaveApi(conclaveOptions)
                .AddControllers();

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

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
