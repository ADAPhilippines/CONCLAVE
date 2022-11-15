using Conclave.Lotto.Web.Models;
using Microsoft.AspNetCore.Components;
using MudBlazor;

namespace Conclave.Lotto.Web.Components;

public partial class BuyTicketDialog
{
    [CascadingParameter]
    public MudDialogInstance? MudDialog { get; set; }

    [Parameter]
    public Session session { get; set; } = new();

    private void OnBtnDepositClicked()
    {
        if (MudDialog is not null)
            MudDialog.Close(DialogResult.Ok(true));
    }

    private void OnBtnCancelClicked()
    {
        if (MudDialog is not null) MudDialog.Cancel();
    }
}