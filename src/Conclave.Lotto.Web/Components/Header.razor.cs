using Conclave.Lotto.Web.Services;
using Microsoft.AspNetCore.Components;
using MudBlazor;

namespace Conclave.Lotto.Web.Components;

public partial class Header
{
    private string Address { get; set; } = string.Empty;

    [Inject] IDialogService? DialogService { get; set; } = default;
    [Inject] NethereumService? NethereumService { get; set; } = default!;

    private bool IsOpen { get; set; }

    private async Task OpenConnectWalletsDialog()
    {
        if (NethereumService is not null)
            await NethereumService.ConnectMetamaskWalletAsync();

        // DialogOptions closeOnEscapeKey = new DialogOptions() { CloseOnEscapeKey = true };
        // DialogService?.Show<ConnectWalletsDialog>("Connect Wallets", closeOnEscapeKey);
    }

    private void OnBtnAddFundsClicked()
    {
        DialogOptions closeOnEscapeKey = new DialogOptions() { CloseOnEscapeKey = true };
        DialogService?.Show<AddFundsDialog>("Add Funds", closeOnEscapeKey);
    }

    public void OnBtnProfileClicked()
    {
        if (IsOpen)
            IsOpen = false;
        else
            IsOpen = true;
    }
}
