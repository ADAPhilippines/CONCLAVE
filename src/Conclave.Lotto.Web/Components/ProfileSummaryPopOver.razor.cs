using Microsoft.AspNetCore.Components;

namespace Conclave.Lotto.Web.Components;

public partial class ProfileSummaryPopOver
{
    [Parameter]
    public bool IsOpen { get; set; }

    [Parameter]
    public EventCallback OnBtnAddFundsClicked { get; set; }
}
