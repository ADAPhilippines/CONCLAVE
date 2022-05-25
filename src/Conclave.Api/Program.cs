using Conclave.Api.Extensions;
using Conclave.Api.Options;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<ConclaveCardanoOptions>(builder.Configuration.GetSection("Conclave"));

// Add services to the container.
builder.Services.AddConclaveDb(builder.Configuration);
builder.Services.AddBlockfrostServices(builder.Configuration);
builder.Services.AddConclaveApi(builder.Configuration);

builder.Services.AddControllers();

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
