using Microsoft.AspNetCore.Components;
using Conclave.Lotto.Web.Services;
using Conclave.Lotto.Web.Models;

namespace Conclave.Lotto.Web.Components;

public partial class SessionHistoryTable : ComponentBase
{
    [Inject]
    private LottoService LottoService { get; set; } = default!;

    public IEnumerable<Session> Elements { get; set; } = default!;

    protected override async Task OnInitializedAsync()
    {
        Elements = await LottoService.GetSessionListAsync();   
    }
}
