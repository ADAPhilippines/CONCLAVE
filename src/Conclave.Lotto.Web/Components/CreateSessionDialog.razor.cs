using MudBlazor;
using Conclave.Lotto.Web.Models;
using Microsoft.AspNetCore.Components;

namespace Conclave.Lotto.Web.Components;

public partial class CreateSessionDialog
{
    [CascadingParameter]
    MudDialogInstance? MudDialog { get; set; }

    private Session sessionDetails { get; set; } = new();

    private DateTime? date = DateTime.Today;

    private void OnBtnSubmitClicked()
    {
        if (MudDialog is not null) MudDialog.Close(DialogResult.Ok(true));

    }
    private void OnBtnCancelClicked()
    {
        if (MudDialog is not null) MudDialog.Cancel();
    }
}
