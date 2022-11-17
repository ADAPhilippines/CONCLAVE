using Microsoft.AspNetCore.Components;
using Conclave.Lotto.Web.Components;
using Conclave.Lotto.Web.Services;
using Conclave.Lotto.Web.Models;
using MudBlazor;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.Forms;

namespace Conclave.Lotto.Web.Pages;

public partial class SessionPage : ComponentBase
{
    [Inject]
    public IDialogService? DialogService { get; set; } = default;

    [Inject]
    private DataService DataService { get; set; } = new();

    [Inject]
    private NavigationManager NavigationManager { get; set; } = default!;

    private IEnumerable<LottoWinner> LottoWinners { get; set; } = default!;

    private IEnumerable<Session> Sessions { get; set; } = default!;

    private ExampleModel exampleModel = new();

    private int MaxLength = 3;

    private MudTextField<string> inputText2 = new();
    protected override void OnInitialized()
    {
        LottoWinners = DataService.LottoWinners;
        Sessions = DataService.Sessions;
    }

    private void OpenDialog()
    {
        DialogOptions closeOnEscapeKey = new() { CloseOnEscapeKey = true };
        DialogService?.Show<CreateSessionDialog>("Create Session", closeOnEscapeKey);
    }

    private void OnSessionCardClicked(Session session)
    {
        NavigationManager.NavigateTo($"session/{session.Id}");
    }

    private void OnBtnBuyTicketClicked(Session session)
    {
        DialogParameters dialogParams = new DialogParameters { ["session"] = session };
        DialogOptions closeOnEscapeKey = new() { CloseOnEscapeKey = true };
        DialogService?.Show<BuyTicketDialog>("Buy Ticket", dialogParams, closeOnEscapeKey);
    }

    private void OnInputKeyPressed(EventArgs args)
    {
        Console.WriteLine($"event args: {args}");
        inputText2.FocusAsync();
    }
}
