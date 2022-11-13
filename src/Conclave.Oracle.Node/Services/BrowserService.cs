
using System.Net;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using PuppeteerSharp;

namespace Conclave.Oracle.Node.Services;

public class BrowserService : IAsyncDisposable
{
    #region Public Properties
    public string? BaseUrl { get; set; }
    public bool IsInitialized { get; private set; }
    #endregion

    #region Private Properties
    private IBrowser? Browser { get; set; }
    private IPage? Page { get; set; }
    private BrowserFetcher? BrowserFetcher { get; set; }
    private readonly IServer _server;
    private readonly ILogger<BrowserService> _logger;
    private int LastPercentRecorded { get; set; }
    #endregion

    public BrowserService(IServer server, ILogger<BrowserService> logger)
    {
        _server = server;
        _logger = logger;
    }

    public async Task InitializeAsync()
    {
        _logger.LogInformation("Downloading Latest Chromium...");
        BrowserFetcher = new();
        BrowserFetcher.DownloadProgressChanged += OnFetcherDownloadProgressChanged;
        await BrowserFetcher.DownloadAsync(BrowserFetcher.DefaultChromiumRevision);
        _logger.LogInformation("Launching Browser");
        Browser = await Puppeteer.LaunchAsync(new()
        {
            Headless = true
        });

        _logger.LogInformation("Browser launched succesfully.");
        Page = await Browser.NewPageAsync();
        while (string.IsNullOrEmpty(BaseUrl = GetServerBaseUrl())) await Task.Delay(1000);

        Uri baseUrl = new(BaseUrl);
        await Page.GoToAsync(new Uri(baseUrl, "index.html").ToString(), WaitUntilNavigation.Load);
        _logger.LogInformation($"Browser Initialized 🚀🚀🚀");

        IsInitialized = true;
    }

    public async Task InvokeFunctionAsync(string functionName)
    {
        if (Page is not null)
            await Page.EvaluateFunctionAsync(functionName);
    }

    public async Task InvokeFunctionAsync(string functionName, params object[] p)
    {
        if (Page is not null)
            await Page.EvaluateFunctionAsync(functionName, p);
    }

    public async Task<T?> InvokeFunctionAsync<T>(string functionName, params object[] p)
    {
        if (Page is not null)
            return await Page.EvaluateFunctionAsync<T>(functionName, p);
        else
            return default;
    }

    public async Task ExposeFunctionAsync<T1, T2, T3, TResult>(string name, Func<T1, T2, T3, TResult> function)
    {
        if (Page is not null)
            await Page.ExposeFunctionAsync<T1, T2, T3, TResult>(name, function);

    }

    public async ValueTask DisposeAsync()
    {
        if (Browser is not null)
            await Browser.CloseAsync();

        if (BrowserFetcher is not null)
            BrowserFetcher.DownloadProgressChanged -= OnFetcherDownloadProgressChanged;
    }

    private string? GetServerBaseUrl()
    {
        var addressFeature = _server.Features.Get<IServerAddressesFeature>();
        return addressFeature?.Addresses.FirstOrDefault();
    }

    public async Task WaitBrowserReadyAsync()
    {
        while (!IsInitialized) await Task.Delay(1000);
    }

    public async Task WaitFunctionReadyAsync(string functionName)
    {
        try
        {
            await Page!.WaitForExpressionAsync($"window.{functionName} && typeof window.{functionName} == 'function'");
        }
        catch (Exception e)
        {
            _logger.LogError(e.Message);
        }
    }

    private void OnFetcherDownloadProgressChanged(object sender, DownloadProgressChangedEventArgs e)
    {
        if (LastPercentRecorded != e.ProgressPercentage)
        {
            LastPercentRecorded = e.ProgressPercentage;
            _logger.LogInformation($"Browser Downloading: {e.ProgressPercentage}%");
        }
    }
}