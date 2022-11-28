using Microsoft.AspNetCore.Components;
using Conclave.Lotto.Web.Models;
using MudBlazor;

namespace Conclave.Lotto.Web.Components;

public partial class Header
{
    [Parameter]
    public EventCallback OnBtnConnectWalletClicked { get; set; }
    
    [Inject] IDialogService? DialogService { get; set; }

    private bool IsOpen { get; set; }

    private FundManagerDetails AddFundsManagerDetails { get; set; } = new()
    {
        Title = "Add",
        Description = "Select the currency you want to deposit to your balance on the platform",
        MadaBalance = 1235,
        CnclvBalance = 123598
    };

    private FundManagerDetails WithdrawFundsManagerDetails { get; set; } = new()
    {
        Title = "Withdraw",
        Description = "Select the currency you want to withdraw from your balance on the platform",
        MadaBalance = 235,
        CnclvBalance = 598
    };

    private void OpenConnectWalletsDialog()
    {
         DialogOptions closeOnEscapeKey = new DialogOptions() { CloseOnEscapeKey = true };
         DialogService?.Show<ConnectWalletsDialog>("Connect Wallets", closeOnEscapeKey);
    }

    private void OpenFundManagerDialog(FundManagerDetails fundManagerDetails )
    {
        DialogParameters dialogParams = new DialogParameters { ["FundManagerDetails"] = fundManagerDetails };
        DialogOptions closeOnEscapeKey = new() { CloseOnEscapeKey = true };
        DialogService?.Show<FundManagerDialog>("", dialogParams, closeOnEscapeKey);
    }
}
