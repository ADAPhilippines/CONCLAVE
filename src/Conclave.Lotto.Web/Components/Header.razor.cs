using Conclave.Lotto.Web.Services;
using Microsoft.AspNetCore.Components;
using MudBlazor;

namespace Conclave.Lotto.Web.Components;

public partial class Header
{
    [Parameter]
    public EventCallback OnBtnConnectWalletClicked { get; set; }

}
