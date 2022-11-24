using Microsoft.AspNetCore.Components;
using MudBlazor;

namespace Conclave.Lotto.Web.Components;

public partial class Header
{
    [Parameter]
    public EventCallback OnBtnConnectWalletClicked { get; set; }
    
    [Inject] IDialogService? DialogService { get; set; }

    private bool IsOpen { get; set; }

    private void OpenConnectWalletsDialog()
    {
         DialogOptions closeOnEscapeKey = new DialogOptions() { CloseOnEscapeKey = true };
         DialogService?.Show<ConnectWalletsDialog>("Connect Wallets", closeOnEscapeKey);
    }

    private void OpenWithdrawFundsDialog()
    {
		var options = new DialogOptions { CloseOnEscapeKey = true };
        DialogService?.Show<WithdrawFundsDialog>("", options);
    }

    private void OpenAddFundsDialog()
    {
		var options = new DialogOptions { CloseOnEscapeKey = true };
        DialogService?.Show<AddFundsDialog>("", options);
    }
}
