

using Microsoft.AspNetCore.Components;
using Conclave.Lotto.Web.Models;

namespace Conclave.Lotto.Web.Components;
public partial class SessionCard
{
    [Parameter]
    public int Interval { get; set; }

    [Parameter]
    public Session SessionDetails { get; set; } = new();

    private string SessionStatusClass()
    {
        if (SessionDetails.CurrentStatus == Status.OnGoing)
            return "border-2 border-rose-600";
        return "border-2";
    }
}