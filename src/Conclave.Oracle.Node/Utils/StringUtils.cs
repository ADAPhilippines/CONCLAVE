using System.Globalization;
using System.Numerics;

namespace Conclave.Oracle.Node.Utils;

public static class StringUtils
{
    public static string HexStringToDecimalString(string hex)
    {
        return BigInteger.Parse(String.Concat("0", hex), NumberStyles.AllowHexSpecifier).ToString();
    }

    public static BigInteger StringToBigInteger(string numberString)
    {
        return BigInteger.Parse(numberString);
    }

    public static BigInteger HexStringToBigInteger(string hex)
    {
        return BigInteger.Parse(String.Concat("0", hex), NumberStyles.AllowHexSpecifier);
    }

    public static List<BigInteger> HexStringListToBigIntegerList(List<string> hexStringList)
    {
        return hexStringList.Select((dec) => StringUtils.HexStringToBigInteger(dec)).ToList();
    }
}
