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

    private string Currency { get; set; } = "mADA";

    private double MilkADABalance { get; set; } = 1235;

    private double ConclaveBalance { get; set; } = 123598;

    private double DepositAmount { get; set; } = 0;

    private bool IsDepositBtnDisabled { get; set; }

    private double ToUSD(double amount)
    {
        if (Currency == "mADA")
            return CurrencyConverterService.ConvertAdaToUsd(amount);
        
        return CurrencyConverterService.ConvertCnclvToUsd(amount);
    } 

    private double GetBalanceOfSelectedCurrency() => 
        Currency == "mADA" ? MilkADABalance : ConclaveBalance;

    private void OnBtnMaxClicked() => 
        DepositAmount = GetBalanceOfSelectedCurrency();

    private string? CheckBalance(double amount)
    {
        if (amount > GetBalanceOfSelectedCurrency())
        {
            IsDepositBtnDisabled = true;
            return "Insufficient balance";
        }
       
       IsDepositBtnDisabled = false;
       return null;
    }

    void Cancel() => MudDialog.Cancel();
}
