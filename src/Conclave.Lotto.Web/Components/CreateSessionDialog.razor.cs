using MudBlazor;
using Conclave.Lotto.Web.Models;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Forms;
using Conclave.Lotto.Web.Services;

namespace Conclave.Lotto.Web.Components;

public partial class CreateSessionDialog
{
    [CascadingParameter]
    MudDialogInstance? MudDialog { get; set; }

    [Parameter]
    public Session SessionDetails { get; set; } = new();

    [Inject]
    public LottoService LottoService {get; set;} = default!;

    private bool success { get; set; }

    private async Task OnBtnSubmitClicked()
    {
        SessionDetails.DateCreated = DateTime.UtcNow;

        await LottoService.CreateSessionAsync(SessionDetails);
        // if (MudDialog is not null ) MudDialog.Close(DialogResult.Ok(true));
    }

    private void OnBtnCancelClicked()
    {
        if (MudDialog is not null) MudDialog.Cancel();
    }

    private void OnSessionStartDateChanged(DateTime? dateSet)
    {
        if (dateSet.HasValue)
            SessionDetails.StartDate = dateSet.Value;
    }

    private void OnSessionStartTimeChanged(TimeSpan? intervalSet)
    {
        if (intervalSet.HasValue)
            SessionDetails.StartTime = intervalSet.Value;
    }

    private void OnValidSubmit()
    {
        Console.WriteLine(SessionDetails.Name);
    }

}
