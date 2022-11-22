
using Microsoft.AspNetCore.Components;
using MudBlazor;

namespace Conclave.Lotto.Web.Components;

public partial class AddFundsDialog
{
    // [CascadingParameter]
    // MudDialogInstance? MudDialog { get; set; }

    // public int TextValue { get; set; }

    // private void OnBtnDepositClicked()
    // {
    //     if (MudDialog is not null)
    //         MudDialog.Close(DialogResult.Ok(true));
    // }

    // private void OnBtnCancelClicked()
    // {
    //     if (MudDialog is not null) MudDialog.Cancel();
    // }

    private void OnBtnMaxClicked() => Console.WriteLine("MaxClicked");
}
