using Microsoft.AspNetCore.Components;

namespace Conclave.Lotto.Web.Components;

public partial class LottoWinnersList
{
    [Parameter]
    public RenderFragment? ChildContent { get; set; }
}
