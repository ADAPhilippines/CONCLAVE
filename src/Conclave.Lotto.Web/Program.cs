using System.Runtime.InteropServices.JavaScript;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Conclave.Lotto.Web;
using MudBlazor.Services;
using Conclave.Lotto.Web.Services;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

builder.Services.AddMudServices();
builder.Services.AddScoped<DataService>();

await JSHost.ImportAsync("Interop", "../dist/App.bundle.js");

await builder.Build().RunAsync();
