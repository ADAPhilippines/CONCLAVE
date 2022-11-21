using System.Numerics;
using Microsoft.AspNetCore.Components;
using MudBlazor;

namespace Conclave.Lotto.Web.Components;

public partial class ConnectWalletsDialog
{
    [Inject] IDialogService DialogService { get; set; } = default!;

    [CascadingParameter] MudDialogInstance MudDialog { get; set; } = default!;

    public string MilkomedaValue { get; set; } = string.Empty;

    public string CardanoValue { get; set; } = string.Empty;


    private void OpenCardanoWalletsDialog()
    {
        var options = new DialogOptions { CloseOnEscapeKey = true };
        DialogService.Show<CardanoWalletsDialog>("", options);
    }

    void Cancel() => MudDialog.Cancel();
}
