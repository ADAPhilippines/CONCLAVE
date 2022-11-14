using Conclave.Lotto.Web.Components;
using Conclave.Lotto.Web.Services;
using Microsoft.AspNetCore.Components;
using MudBlazor;

namespace Conclave.Lotto.Web.Shared;

public partial class MainLayout
{
    private string Address { get; set; } = string.Empty;
    
    [Inject] IDialogService? DialogService { get; set; } = default;

    private bool IsOpen { get; set; }

    private async Task OnBtnConnectWalletClicked()
    {
        Address = await Interop.GetWalletAddress();
        await InvokeAsync(StateHasChanged);
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