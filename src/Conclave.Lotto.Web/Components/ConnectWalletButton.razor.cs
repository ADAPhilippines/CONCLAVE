using Microsoft.AspNetCore.Components;

namespace Conclave.Lotto.Web.Components;

public partial class ConnectWalletButton
{

    [Parameter]
    public RenderFragment? ChildContent { get; set; }
    
    [Parameter]
    public string? Address { get; set; }

    [Parameter]
    public EventCallback OnBtnConnectWalletClicked { get; set; }

    [Parameter]
    public EventCallback OnBtnAddFundsClicked { get; set; }

    [Parameter]
    public EventCallback OnBtnProfileClicked { get; set; }
}
