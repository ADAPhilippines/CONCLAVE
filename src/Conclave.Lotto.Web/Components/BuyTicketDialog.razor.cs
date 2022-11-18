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

    static int test = 5;

    private List<int> Entries = new List<int>(new int[test]);
    private EventCallback<List<int>> EntriesChanged { get; set; }

    private List<Inputs> TicketEntries = new List<Inputs>(){
        new() {},
        new() {}
    };

    private Dictionary<int, MudTextField<int>> InputTextRef = new();

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
        Console.WriteLine(entry.Value);
        if (entry.Value.Length >= 3)
        {
            int nextIndex = Entries.IndexOf(entry) + 1;
            await Entries[nextIndex].ElementRef.FocuAsync();
        }
    }
}