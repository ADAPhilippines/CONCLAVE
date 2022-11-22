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

    private bool mandatory { get; set; } = true;

    private Status SessionStatus { get; set; } = Status.Ongoing;

    private Session SessionDetails { get; set; } = new();

    protected async override Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            Sessions = await LottoService.GetSessionListAsync();
            LottoWinners = await LottoService.GetLottoWinnersAsync();
            if (Sessions is not null)
                PaginatedSessions = Sessions;
            await InvokeAsync(StateHasChanged);
        }
        await base.OnAfterRenderAsync(firstRender);
    }
    private void OnBtnCreateSessionClicked()
    {
        DialogOptions closeOnEscapeKey = new() { CloseOnEscapeKey = true };
        DialogParameters dialogParams = new DialogParameters
        {
            ["SessionDetails"] = SessionDetails,
            ["SessionList"] = Sessions
        };
        DialogService?.Show<CreateSessionDialog>("Create Session", dialogParams, closeOnEscapeKey);
    }

    private void OnBtnBuyTicketClicked(Session session)
    {
        DialogParameters dialogParams = new DialogParameters
        {
            ["SessionDetails"] = session,
        };
        DialogOptions closeOnEscapeKey = new() { CloseOnEscapeKey = true };
        DialogService?.Show<BuyTicketDialog>("Buy Ticket", dialogParams, closeOnEscapeKey);
    }

    private void OnSessionCardClicked(Session session)
    {
        NavigationManager.NavigateTo($"session/{session.Id}");
    }

    private void OnPageChanged(int page)
    {
        int index = page;
        int maxItems = 3;
        index = page * maxItems - maxItems;
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
