using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Conclave.Lotto.Web;
using MudBlazor.Services;
using Conclave.Lotto.Web.Services;
using Nethereum.Metamask;
using Nethereum.Metamask.Blazor;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

builder.Services.AddSingleton<IMetamaskInterop, MetamaskBlazorInterop>();
builder.Services.AddSingleton<MetamaskInterceptor>();
builder.Services.AddSingleton<MetamaskHostProvider>();

builder.Services.AddMudServices();
builder.Services.AddScoped<DataService>();
builder.Services.AddScoped<NethereumService>();
builder.Services.AddScoped<ClipboardService>();


await builder.Build().RunAsync();
