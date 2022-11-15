using Microsoft.AspNetCore.Components;
using Conclave.Lotto.Web.Components;
using Conclave.Lotto.Web.Services;
using Conclave.Lotto.Web.Models;
using MudBlazor;

namespace Conclave.Lotto.Web.Pages;

public partial class SessionPage : ComponentBase
{
    [Inject]
    public IDialogService? DialogService { get; set; } = default;

    [Inject]
    private DataService DataService { get; set; } = new();

    private IEnumerable<LottoWinner> LottoWinners { get; set; } = default!;

    private IEnumerable<Session> Sessions { get; set; } = default!;

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
}
