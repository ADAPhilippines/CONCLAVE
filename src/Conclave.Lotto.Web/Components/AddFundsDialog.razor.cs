using Microsoft.AspNetCore.Components;
using Conclave.Lotto.Web.Services;
using MudBlazor;

namespace Conclave.Lotto.Web.Components;

public partial class AddFundsDialog
{
    [CascadingParameter]
    MudDialogInstance MudDialog { get; set; } = default!;

    [Inject]
    private CurrencyConverterService CurrencyConverterService { get; set; } = default!;

    private string Currency { get; set; } = "MilkADA";

    private double MilkADABalance { get; set; } = 103321;

    private double ConclaveBalance { get; set; } = 2058943;

    private double DepositAmount { get; set; } = 0;

    private double ToUSD(double amount)
    {
        if (Currency == "MilkADA")
            return CurrencyConverterService.ConvertAdaToUsd(amount);
        
        return CurrencyConverterService.ConvertCnclvToUsd(amount);
    } 

    private double GetBalanceOfSelectedCurrency() => 
        Currency == "MilkADA" ? MilkADABalance : ConclaveBalance;

    private void OnBtnMaxClicked() => 
        DepositAmount = GetBalanceOfSelectedCurrency();

    void Submit() => MudDialog.Close(DialogResult.Ok(true));
    void Cancel() => MudDialog.Cancel();
}
