using Microsoft.JSInterop;

namespace Conclave.Lotto.Web.Services;

public class ClipboardService
{
    private readonly IJSRuntime _jsRunTime;

    public ClipboardService(IJSRuntime jsRuntime)
    {
        _jsRunTime = jsRuntime;
    }

    public async Task CopyTextToClipboardAsync(string text)
    {
        await _jsRunTime.InvokeVoidAsync("window.copyText", text);
    }
}
