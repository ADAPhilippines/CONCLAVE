using MudBlazor;
using Conclave.Lotto.Web.Models;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;

namespace Conclave.Lotto.Web.Components;

public partial class CreateSessionDialog
{
    [CascadingParameter]
    MudDialogInstance? MudDialog { get; set; }

    private Session sessionDetails { get; set; } = new();

    private bool success { get; set; }

    private void OnBtnSubmitClicked()
    {
        if (MudDialog is not null) MudDialog.Close(DialogResult.Ok(true));
    }

    private void OnBtnCancelClicked()
    {
        if (MudDialog is not null) MudDialog.Cancel();
    }

    private void OnSessionStartDateChanged(DateTime? dateSet)
    {
        if (dateSet.HasValue)
            sessionDetails.StartDate = dateSet.Value;
    }

    private void OnSessionStartTimeChanged(TimeSpan? intervalSet)
    {
        if (intervalSet.HasValue)
            sessionDetails.StartTime = intervalSet.Value;
    }

    private void OnValidSubmit(EditContext context)
    {
        success = true;
    }

}
