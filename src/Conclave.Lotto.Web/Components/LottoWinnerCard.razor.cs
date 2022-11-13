using System.Numerics;
using Microsoft.AspNetCore.Components;

namespace Conclave.Lotto.Web.Components;

public partial class LottoWinnerCard
{
    [Parameter]
    public string Address { get; set; } = string.Empty;

    [Parameter]
    public BigInteger PrizeWon { get; set; }
}
