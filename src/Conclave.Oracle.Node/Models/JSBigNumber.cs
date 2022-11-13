using System.Numerics;

namespace Conclave.Oracle.Node.Models;

public class JSBigNumber
{
    public string _hex { get; set; } = string.Empty;
    public bool _isBigNumber { get; set; } = true;
    public JSBigNumber(string hex)
    {
        if (!hex.Contains('x')) String.Concat("0x0", hex);
        _hex = hex;
    }
}