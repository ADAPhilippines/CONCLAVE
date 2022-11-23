using Conclave.Lotto.Web.Models;
using Conclave.Lotto.Web.Services;
using Microsoft.AspNetCore.Components;

namespace Conclave.Lotto.Web.Pages;

public partial class SessionDetailsPage
{
    [Inject]
    private LottoService LottoService { get; set; } = default!;

    [Parameter]
    public string SessionId { get; set; } = string.Empty;

    private Session SessionDetails { get; set; } = new();

    protected override async Task OnInitializedAsync()
    {
        SessionDetails = await LottoService.GetSessionById(Int32.Parse(SessionId));
    }
}