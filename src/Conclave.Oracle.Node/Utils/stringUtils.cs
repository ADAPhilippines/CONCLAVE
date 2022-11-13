using System.Globalization;
using System.Numerics;

namespace Conclave.Oracle.Node.Utils;

public static class StringUtils
{
    public static string HexToDecimalString(string hex)
    {
        return BigInteger.Parse(String.Concat("0", hex), NumberStyles.AllowHexSpecifier).ToString();
    }

    public static BigInteger StringToBigInteger(string numberString)
    {
        return BigInteger.Parse(numberString);
    }
}
