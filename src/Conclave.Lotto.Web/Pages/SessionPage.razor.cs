using Microsoft.AspNetCore.Components;
using Conclave.Lotto.Web.Components;
using Conclave.Lotto.Web.Services;
using Conclave.Lotto.Web.Models;
using MudBlazor;
using Microsoft.AspNetCore.Components.Web;

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

    private List<Session> Sessions { get; set; } = default!;

    private List<Session> PaginatedSessions { get; set; } = default!;

    private bool mandatory { get; set; } = true;

    private Status SessionStatus { get; set; } = Status.OnGoing;

    protected override void OnInitialized()
    {
        LottoWinners = DataService.LottoWinners;
        Sessions = DataService.Sessions;
        PaginatedSessions = Sessions.GetRange(0, 3);
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
        DialogParameters dialogParams = new DialogParameters { ["SessionDetails"] = session };
        DialogOptions closeOnEscapeKey = new() { CloseOnEscapeKey = true };
        DialogService?.Show<BuyTicketDialog>("Buy Ticket", dialogParams, closeOnEscapeKey);
    }


    private void OnPageChanged(int page)
    {
        int index = page;
        int maxItems = 3;
        index = page * maxItems - maxItems;
        PaginatedSessions = Sessions.GetRange(index, maxItems);
    }

    private void OnSelectedChipChanged(MudChip chip)
    {
        if (chip.Text == "PrizePool")
            Sessions.Sort((a, b) =>
            {
                return a.PrizePool.CompareTo(b.PrizePool);
            });
        else if (chip.Text == "Latest")
            Sessions.Sort((a, b) =>
            {
                return DateTime.Compare(a.DateCreated, b.DateCreated);
            });
        else
            Sessions.Sort((a, b) => { return a.Id.CompareTo(b.Id); });

        PaginatedSessions = Sessions.GetRange(0, 3);
    }

    private void OnSelectValuesChanged(ChangeEventArgs args)
    {
        List<Session> FilteredSessions = new();
        if (args?.Value?.ToString() == "OnGoing")
        {
            FilteredSessions = Sessions.FindAll(s => s.CurrentStatus == Status.OnGoing);
            PaginatedSessions = FilteredSessions.GetRange(0, 2);
        }
        else if (args?.Value?.ToString() == "UpComing")
        {
            FilteredSessions = Sessions.FindAll(s => s.CurrentStatus == Status.UpComing);
            PaginatedSessions = FilteredSessions.GetRange(0, 3);
        }
    }
}
