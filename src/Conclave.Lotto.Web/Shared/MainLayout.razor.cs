using Conclave.Lotto.Web.Components;
using Conclave.Lotto.Web.Services;
using Microsoft.AspNetCore.Components;
using MudBlazor;

namespace Conclave.Lotto.Web.Shared;

public partial class MainLayout
{
    [Inject] IDialogService? DialogService { get; set; } = default;

    private void OnBtnConnectWalletClicked()
    {
        DialogOptions closeOnEscapeKey = new DialogOptions() { CloseOnEscapeKey = true };
        DialogService?.Show<ConnectWalletsDialog>("Connect Wallets", closeOnEscapeKey);
    }
}