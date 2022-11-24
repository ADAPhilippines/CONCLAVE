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
    private LottoService LottoService { get; set; } = default!;

    [Inject]
    private NavigationManager NavigationManager { get; set; } = default!;

    private List<LottoWinner> LottoWinners { get; set; } = new();

    private List<Session> Sessions { get; set; } = default!;

    private List<Session> PaginatedSessions { get; set; } = new();

    private int PageCount { get; set; }

    private bool Mandatory { get; set; } = true;

    protected override async Task OnInitializedAsync()
    {
        Sessions = await LottoService.GetSessionListAsync();
        LottoWinners = await LottoService.GetLottoWinnersAsync();
        PageCount = Sessions.Count() / 3;

        if (Sessions is not null)
            OnPageChanged(1);
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
        int maxIndex = page * 3 - 1;
        int index = page * 3 - 3;
        PaginatedSessions = Sessions.FindAll(x => x.Id >= index && x.Id <= maxIndex);
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
    }

    private void OnSelectValuesChanged(ChangeEventArgs args)
    {
        List<Session> FilteredSessions = new();
        if (args?.Value?.ToString() == "OnGoing")
        {
            FilteredSessions = Sessions.FindAll(s => s.CurrentStatus == Status.Ongoing);
        }
        else if (args?.Value?.ToString() == "UpComing")
        {
            FilteredSessions = Sessions.FindAll(s => s.CurrentStatus == Status.Upcoming);
        }
    }
}
