using System.Numerics;
using Microsoft.AspNetCore.Components;

namespace Conclave.Lotto.Web.Components;

public partial class TicketDetails
{
    [Parameter]
    public string SessionId { get; set; } = string.Empty;

    [Parameter]
    public string TicketEntry { get; set; } = string.Empty;

    [Parameter]
    public BigInteger Prize { get; set; }
}
