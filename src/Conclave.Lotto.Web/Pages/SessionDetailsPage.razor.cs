using Conclave.Lotto.Web.Models;
using Conclave.Lotto.Web.Services;
using Microsoft.AspNetCore.Components;

namespace Conclave.Lotto.Web.Pages;

public partial class SessionDetailsPage
{
    [Inject]
    private DataService DataService { get; set; } = new();

    [Parameter]
    public string? SessionId { get; set; }

    private Session SessionDetails { get; set; } = new();

    protected override void OnInitialized()
    {
        SessionDetails = DataService.Sessions.FirstOrDefault();
    }
}