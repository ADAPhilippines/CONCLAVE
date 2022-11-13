using System.Numerics;

namespace Conclave.Lotto.Web.Models;

public record LottoWinner
{
    public string Address { get; set; } = string.Empty;

    public BigInteger PrizeWon { get; set; }
}
