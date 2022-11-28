namespace Conclave.Lotto.Web.Services;

public class CurrencyConverterService
{
    private double AdaToUsdValue { get; set; } = 0.3;

    private double CnlcvToUsdValue { get; set; } = 0.6;

    public double ConvertAdaToUsd(double adaAmount) => adaAmount * AdaToUsdValue;

    public double ConvertCnclvToUsd(double cnclvAmount) => cnclvAmount * CnlcvToUsdValue;
}
