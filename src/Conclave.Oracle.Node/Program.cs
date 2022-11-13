using Conclave.Oracle;
using Conclave.Oracle.Node.Extensions;
using Conclave.Oracle.Node.Services;
using Conclave.Oracle.Node.Models;

var builder = WebApplication.CreateBuilder(args);

IConfiguration config = builder.Configuration.GetSection("NodeSettings");
string network = config.GetValue<string>("BlockFrostNetwork");
string apiKey = config.GetValue<string>("BlockFrostAPIKey");

builder.Services.Configure<SettingsParameters>(config);
builder.Services.AddBlockFrostService(network, apiKey);
builder.Services.AddBrowserService();
builder.Services.AddSingleton<EthereumWalletServices>();
builder.Services.AddSingleton<OracleContractService>();
builder.Services.AddHostedService<OracleWorker>();
builder.Services.AddControllers();

var app = builder.Build();

app.UseStaticFiles();
app.MapControllers();
app.Run();