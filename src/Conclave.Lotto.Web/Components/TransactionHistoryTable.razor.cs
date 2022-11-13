using Microsoft.AspNetCore.Components;
using Conclave.Lotto.Web.Services;
using Conclave.Lotto.Web.Models;

namespace Conclave.Lotto.Web.Components;

public partial class TransactionHistoryTable : ComponentBase
{
    [Inject]
    private DataService DataService { get; set; } = default!;

    private IEnumerable<Transaction> Elements { get; set; } = default!;

    protected override void OnInitialized()
    {
        Elements = DataService.Transactions;
    }
}
