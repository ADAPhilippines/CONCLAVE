using Conclave.Lotto.Web.Models;
using Conclave.Lotto.Web.Services;
using Microsoft.AspNetCore.Components;

namespace Conclave.Lotto.Web.Pages;

public partial class SessionDetailsPage
{
    [Inject]
    private DataService DataService { get; set; } = new();

    [Parameter]
    public string SessionId { get; set; } = string.Empty;

    private Session SessionDetails { get; set; } = new();

    protected override void OnInitialized()
    {
        List<Session> SessionList = DataService.Sessions;
        SessionDetails = SessionList.Find(s => s.Id.ToString() == SessionId);
    }
}