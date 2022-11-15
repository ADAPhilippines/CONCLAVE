using Conclave.Lotto.Web.Models;

namespace Conclave.Lotto.Web.Services;

public class DataService
{
    public IEnumerable<Ticket> Tickets { get; } = new List<Ticket>
    {
        new Ticket { Date = "11-07-2022", SessionId = 123456, Combination = 6, Price = 10, Status = Status.OnGoing },
        new Ticket { Date = "11-08-2022", SessionId = 23423, Combination = 4, Price = 12 },
        new Ticket { Date = "12-01-2022", SessionId = 783643, Combination = 5, Price = 15, Status = Status.OnGoing },
        new Ticket { Date = "12-21-2022", SessionId = 762348, Combination = 8, Price = 12, Status = Status.Completed },
        new Ticket { Date = "12-23-2022", SessionId = 32131, Combination = 7, Price = 10, Status = Status.Completed },
    };

    public IEnumerable<Transaction> Transactions { get; } = new List<Transaction>
    {
        new Transaction
        {
            Date = "11-07-2022",
            TxHash = "8798174jkjjda9878234nsadm90jafd",
            Amount = 10,
            TxType = TransactionType.TicketPurchase
        },
        new Transaction
        {
            Date = "11-08-2022",
            TxHash = "klj7adf9kASDf98sdfla0adf93247Ga",
            Amount = 12000,
            TxType = TransactionType.SessionCreation
        },
        new Transaction
        {
            Date = "12-01-2022",
            TxHash = "GdsE3234csd332DJzfg445Bcdf324ds",
            Amount = 15,
            TxType = TransactionType.TicketPurchase
        },
        new Transaction
        {
            Date = "12-21-2022",
            TxHash = "lkf301239dsdfHczl98fsAZ9flpd0AeE",
            Amount = 5000,
            TxType = TransactionType.SessionCreation
        },
        new Transaction
        {
            Date = "12-23-2022",
            TxHash = "yu93lDldfP9034Bdf9834dkfSDl094dl",
            Amount = 12,
            TxType = TransactionType.TicketPurchase
        }
    };

    public IEnumerable<Session> Sessions { get; } = new List<Session>
    {
        new Session {
            Id = 4532,
            Name = "Lorem Ipsum",
            CurrentStatus = Status.OnGoing,
            PrizePool = 12000,
            TicketPrice = 20,
            Combinations = 5,
            MaxValue = 65,
            Margin = 5,
            Interval = 10
        },
        new Session {
            Id = 4532,
            Name = "The brown fox",
            CurrentStatus = Status.OnGoing,
            PrizePool = 231578,
            TicketPrice = 20,
            Combinations = 5,
            MaxValue = 65,
            Margin = 5,
            Interval = 30
        },
        new Session {
            Id = 4532,
            Name = "Dolor sit amet",
            CurrentStatus = Status.Active,
            PrizePool = 54532,
            TicketPrice = 220,
            Combinations = 5,
            MaxValue = 65,
            Margin = 5,
            Interval = 115
        }
    };

    public IEnumerable<LottoWinner> LottoWinners { get; } = new List<LottoWinner>
    {
        new LottoWinner { Address = "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4", PrizeWon = 5000 },
        new LottoWinner { Address = "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2", PrizeWon = 12000 },
        new LottoWinner { Address = "0x17F6AD8Ef982297579C203069C1DbfFE4348c372", PrizeWon = 15000 }
    };
}
