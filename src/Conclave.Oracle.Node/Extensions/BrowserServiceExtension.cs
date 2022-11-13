using Conclave.Oracle.Node.Services;
using Microsoft.AspNetCore.Hosting.Server;

namespace Conclave.Oracle.Node.Extensions;

public static class BrowseServiceExtension
{
    public static IServiceCollection AddBrowserService(this IServiceCollection serviceCollection)
    {
        serviceCollection.AddSingleton<BrowserService>((serviceProvider) =>
        {
            IServer? server = serviceProvider.GetService<IServer>();
            ILogger<BrowserService>? logger = serviceProvider.GetService<ILogger<BrowserService>>();
            BrowserService browserService;
            if (server is not null && logger is not null)
            {
                browserService = new BrowserService(server, logger);
                _ = browserService.InitializeAsync();
            }
            else
            {
                throw new NullReferenceException("The IServer required by BrowserService is null.");
            }
            return browserService;
        });
        return serviceCollection;
    }
}