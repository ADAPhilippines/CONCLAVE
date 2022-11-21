using Conclave.Lotto.Web.Models;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using MudBlazor;

namespace Conclave.Lotto.Web.Components;

public partial class BuyTicketDialog
{
    [CascadingParameter]
    public MudDialogInstance? MudDialog { get; set; }

    [Parameter]
    public Session SessionDetails { get; set; } = new();

    private List<Inputs> TicketEntries = new List<Inputs>(){
        new() {},
        new() {},
        new() {}
    };

    private void OnBtnDepositClicked()
    {
        if (MudDialog is not null)
            MudDialog.Close(DialogResult.Ok(true));
    }

    private void OnBtnCancelClicked()
    {
        if (MudDialog is not null) MudDialog.Cancel();
    }

    private async Task OnKeyPressed(Inputs entry)
    {
        if (entry.Value.Length >= 3)
        {
            int nextIndex = TicketEntries.IndexOf(entry) + 1;
            if (nextIndex < TicketEntries.Count)
                await TicketEntries[nextIndex].ElementRef.FocusAsync();
        }
    }
}