using Microsoft.AspNetCore.Components;
using Conclave.Lotto.Web.Services;
using MudBlazor;

namespace Conclave.Lotto.Web.Components;

public partial class ConnectWalletsDialog
{
    [Inject] IDialogService DialogService { get; set; } = default!;

    [Inject] ClipboardService ClipboardService { get; set; } = default!;

    [Inject] ISnackbar Snackbar { get; set; } = default!;

    [CascadingParameter] MudDialogInstance MudDialog { get; set; } = default!;

    private string MetamaskAddress { get; set; } = "0x07351aCf3550390017CE7277604fc0f5c08B5431";

    private string CardanoAddress { get; set; } = "addr_test1qrr86cuspxp7e3....5us6td4tas36a9xqoty";

    private string MilkomedaValue { get; set; } = string.Empty;

    private string CardanoValue { get; set; } = string.Empty;

    private void OpenCardanoWalletsDialog()
    {
        var options = new DialogOptions { CloseOnEscapeKey = true };
        DialogService.Show<CardanoWalletsDialog>("", options);
    }

    private async Task OnCopyButtonClicked(string text)
    {
        await ClipboardService.CopyTextToClipboardAsync(text);
        Snackbar.Add("Copied to clipboard!", Severity.Success);
    }

    void Cancel() => MudDialog.Cancel();
}
