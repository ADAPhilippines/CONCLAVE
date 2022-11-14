using Microsoft.AspNetCore.Components;
using MudBlazor;

namespace Conclave.Lotto.Web.Components;

public partial class ConnectWalletsDialog
{
    [Inject] IDialogService DialogService { get; set; } = default!;

    [CascadingParameter] MudDialogInstance MudDialog { get; set; } = default!;

    private void OpenCardanoWalletsDialog()
    {
        var options = new DialogOptions { CloseOnEscapeKey = true };
        DialogService.Show<CardanoWalletsDialog>("", options);
    }

    void Submit() => MudDialog.Close(DialogResult.Ok(true));
    void Cancel() => MudDialog.Cancel();
}
