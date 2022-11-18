using Conclave.Oracle;
using Conclave.Oracle.Node.Extensions;
using Conclave.Oracle.Node.Services;
using Conclave.Oracle.Node.Models;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

IConfiguration config = builder.Environment.IsDevelopment() ? builder.Configuration.GetSection("Development:NodeSettings") : builder.Configuration.GetSection("Production:NodeSettings");
builder.Configuration.GetValue<string>("PrivateKey");
string? network = config.GetValue<string>("BlockFrostNetwork");
string? apiKey = builder.Configuration.GetValue<string>("BlockFrostAPIKey");
builder.Services.AddLogging(opt =>
     {
         opt.AddSimpleConsole(c =>
         {
             c.TimestampFormat = "[HH:mm:ss] ";
             c.IncludeScopes = true;
         });
     });
builder.Services.Configure<SettingsParameters>(config);
builder.Services.AddCardanoService(network!, apiKey!);
builder.Services.AddSingleton<EthAccountServices>();
builder.Services.AddSingleton<OracleContractService>();
builder.Services.AddHostedService<OracleWorker>();
builder.Services.AddControllers();

WebApplication app = builder.Build();

app.Run();