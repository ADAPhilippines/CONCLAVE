using Microsoft.AspNetCore.Components;
using Conclave.Lotto.Web.Services;
using Conclave.Lotto.Web.Models;

namespace Conclave.Lotto.Web.Components;

public partial class SessionHistoryTable : ComponentBase
{
    [Inject]
    public DataService DataService { get; set; } = default!;

    public IEnumerable<Session> Elements { get; set; } = default!;

    protected override void OnInitialized()
    {
        Elements = DataService.Sessions;   
    }
}
