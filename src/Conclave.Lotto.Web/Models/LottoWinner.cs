namespace Conclave.Lotto.Web.Models;

public record LottoWinner
{
    public string Address { get; set; } = string.Empty;

    public int PrizeWon { get; set; }
}
