namespace Conclave.Lotto.Web.Models;

public enum TransactionType
{
    TicketPurchase,
    SessionCreation
}

public record Transaction
{
    public string Date { get; set; } = default!;

    public string TxHash { get; set; } = default!;

    public int Amount { get; set; }

    public TransactionType TxType { get; set; }
}
