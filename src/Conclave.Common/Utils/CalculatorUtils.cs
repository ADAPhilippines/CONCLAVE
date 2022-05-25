namespace Conclave.Common.Utils;


public static class CalculatorUtils
{
    public static double GetPercentage(double total, double partial)
    {
        return partial * 1.0 / total * 100.0;
    }

    public static double GetPercentage(ulong total, ulong partial)
    {
        var doubleTotal = total * 1.0;
        var doublePartial = partial * 1.0;
        var percentage = doublePartial / doubleTotal * 100;
        return percentage;
    }
}