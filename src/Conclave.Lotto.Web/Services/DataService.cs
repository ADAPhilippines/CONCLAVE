using Conclave.Lotto.Web.Models;

namespace Conclave.Lotto.Web.Services;

public class DataService
{
    public IEnumerable<Ticket> Tickets { get; } = new List<Ticket>
    {
        new Ticket { Date = "11-07-2022", SessionId = 123456, Combination = 6, Price = 10, Status = Status.Ongoing },
        new Ticket { Date = "11-08-2022", SessionId = 23423, Combination = 4, Price = 12 },
        new Ticket { Date = "12-01-2022", SessionId = 783643, Combination = 5, Price = 15, Status = Status.Ongoing },
        new Ticket { Date = "12-21-2022", SessionId = 762348, Combination = 8, Price = 12, Status = Status.Upcoming },
        new Ticket { Date = "12-23-2022", SessionId = 32131, Combination = 7, Price = 10, Status = Status.Upcoming },
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

    public List<Session> Sessions { get; } = new List<Session>
    {
        new Session {
            Id = 0,
            Name = "Test 1st Session",
            CurrentStatus = Status.Ongoing,
            PrizePool = 545426,
            TicketPrice = 20,
            Combinations = 5,
            MaxValue = 65,
            Margin = 5,
            Interval = 10,
            StartDate = new DateTime(2022, 12, 16, 7, 30, 00, DateTimeKind.Utc),
            DateCreated = new DateTime(2022, 10, 16, 6, 15, 00, DateTimeKind.Utc)
        },
        new Session {
            Id = 1,
            Name = "Test 2nd Session",
            CurrentStatus = Status.Ongoing,
            PrizePool = 231578,
            TicketPrice = 20,
            Combinations = 5,
            MaxValue = 65,
            Margin = 5,
            Interval = 30,
            StartDate = new DateTime(2022, 11, 19, 7, 00, 00, DateTimeKind.Utc),
            DateCreated = new DateTime(2022, 11, 17, 6, 15, 00, DateTimeKind.Utc)
        },
        new Session {
            Id = 2,
            Name = "Test 3rd Session",
            CurrentStatus = Status.Upcoming,
            PrizePool = 54532,
            TicketPrice = 220,
            Combinations = 5,
            MaxValue = 65,
            Margin = 5,
            Interval = 115,
            StartDate = new DateTime(2022, 12, 17, 7, 30, 00, DateTimeKind.Utc),
            DateCreated = new DateTime(2022, 03, 13, 6, 15, 00, DateTimeKind.Utc)
        },
        new Session {
            Id = 3,
            Name = "Test 4th Session",
            CurrentStatus = Status.Upcoming,
            PrizePool = 32352,
            TicketPrice = 20,
            Combinations = 5,
            MaxValue = 65,
            Margin = 5,
            Interval = 10,
            StartDate = new DateTime(2022, 12, 16, 7, 30, 00, DateTimeKind.Utc),
            DateCreated = new DateTime(2022, 11, 13, 6, 15, 00, DateTimeKind.Utc)
        },
        new Session {
            Id = 4,
            Name = "Test 5th Session",
            CurrentStatus = Status.Upcoming,
            PrizePool = 987524,
            TicketPrice = 20,
            Combinations = 5,
            MaxValue = 65,
            Margin = 5,
            Interval = 10,
            StartDate = new DateTime(2022, 12, 16, 7, 30, 00, DateTimeKind.Utc),
            DateCreated = new DateTime(2022, 02, 13, 6, 15, 00, DateTimeKind.Utc)
        },
        new Session {
            Id = 5,
            Name = "Test 6th Session",
            CurrentStatus = Status.Upcoming,
            PrizePool = 3684,
            TicketPrice = 20,
            Combinations = 5,
            MaxValue = 65,
            Margin = 5,
            Interval = 10,
            StartDate = new DateTime(2022, 12, 19, 7, 30, 00, DateTimeKind.Utc),
            DateCreated = new DateTime(2022, 11, 13, 6, 15, 00, DateTimeKind.Utc)
        },
        new Session {
            Id = 6,
            Name = "Test 7th Session",
            CurrentStatus = Status.Upcoming,
            PrizePool = 39785,
            TicketPrice = 20,
            Combinations = 5,
            MaxValue = 65,
            Margin = 5,
            Interval = 10,
            StartDate = new DateTime(2022, 12, 16, 7, 30, 00, DateTimeKind.Utc),
            DateCreated = new DateTime(2022, 11, 14, 6, 15, 00, DateTimeKind.Utc)
        },
        new Session {
            Id = 7,
            Name = "Test 8th Session",
            CurrentStatus = Status.Upcoming,
            PrizePool = 13634,
            TicketPrice = 20,
            Combinations = 5,
            MaxValue = 65,
            Margin = 5,
            Interval = 10,
            StartDate = new DateTime(2022, 12, 16, 7, 30, 00, DateTimeKind.Utc),
            DateCreated = new DateTime(2022, 10, 13, 6, 15, 00, DateTimeKind.Utc)
        },
        new Session {
            Id = 8,
            Name = "Test 9th Session",
            CurrentStatus = Status.Upcoming,
            PrizePool = 43432,
            TicketPrice = 20,
            Combinations = 5,
            MaxValue = 65,
            Margin = 5,
            Interval = 10,
            StartDate = new DateTime(2022, 12, 16, 7, 30, 00, DateTimeKind.Utc),
            DateCreated = new DateTime(2022, 9, 13, 6, 15, 00, DateTimeKind.Utc)
        }
    };

    public IEnumerable<LottoWinner> LottoWinners { get; } = new List<LottoWinner>
    {
        new LottoWinner { Address = "0x5B38Da6a701c568545dCfcB03FcB875f56beddC4", PrizeWon = 5000 },
        new LottoWinner { Address = "0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2", PrizeWon = 12000 },
        new LottoWinner { Address = "0x17F6AD8Ef982297579C203069C1DbfFE4348c372", PrizeWon = 15000 }
    };
}
