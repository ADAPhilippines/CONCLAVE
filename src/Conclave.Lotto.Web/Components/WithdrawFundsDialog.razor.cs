using Microsoft.AspNetCore.Components;
using Conclave.Lotto.Web.Services;
using MudBlazor;

namespace Conclave.Lotto.Web.Components;

public partial class WithdrawFundsDialog
{
    [CascadingParameter]
    MudDialogInstance MudDialog { get; set; } = default!;

    [Inject]
    private CurrencyConverterService CurrencyConverterService { get; set; } = default!;

    private string Currency { get; set; } = "mADA";

    private double MilkADABalance { get; set; } = 235;

    private double ConclaveBalance { get; set; } = 598;

    private double DepositAmount { get; set; } = 0;

    private bool IsDepositBtnDisabled { get; set; }

    private void OnCurrencyValueChanged(string newCurrency)
    {
        DepositAmount = 0;
        Currency = newCurrency;
    }

    private void OnInputAmountChanged(double amount)
    {
        if (IsValidAmount(amount))
        {
            DepositAmount = amount;
            IsDepositBtnDisabled = false;
        }
    }

    private double ToUSD(double amount)
    {
        if (Currency == "mADA")
            return CurrencyConverterService.ConvertAdaToUsd(amount);
        
        return CurrencyConverterService.ConvertCnclvToUsd(amount);
    }   

    private IEnumerable<string> ValidateInput(double amount)
    {
        if (IsValidAmount(amount))
        {
            IsDepositBtnDisabled = false;
            yield break;
        }

        if (amount < 0)
        {
            IsDepositBtnDisabled = true;
            DepositAmount = 0;
            yield return "Invalid input";
        }

        if (amount > GetBalanceOfSelectedCurrency())
        {
            IsDepositBtnDisabled = true;
            yield return "Insufficient balance";
        }
    }

     private double GetBalanceOfSelectedCurrency() => 
        Currency == "mADA" ? MilkADABalance : ConclaveBalance;

    private void OnBtnMaxClicked() => 
        DepositAmount = GetBalanceOfSelectedCurrency();

    private bool IsValidAmount(double amount) => 
        amount >= 0 && amount < GetBalanceOfSelectedCurrency();

    void Cancel() => MudDialog.Cancel();
}
