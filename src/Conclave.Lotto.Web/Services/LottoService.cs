using Conclave.Lotto.Web.Models;
using System.Text.Json;
using System.Net.Http.Json;

namespace Conclave.Lotto.Web.Services;

public class LottoService
{
    public HttpClient _httpClient { get; set; } = default!;

    public LottoService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<List<Session>> GetSessionListAsync()
    {
        List<Session> Sessions = await _httpClient.GetFromJsonAsync<List<Session>>("lotto-data/sessions.json") ?? new();
        return Sessions;
    }

    public async Task<Session> GetSessionById(int SessionId)
    {
        List<Session> SessionList = await _httpClient.GetFromJsonAsync<List<Session>>("lotto-data/sessions.json") ?? new();
        Session Session = SessionList.Find(s => s.Id == SessionId) ?? new();
        return Session;
    }

    public async Task<List<LottoWinner>> GetLottoWinnersAsync()
    {
        List<LottoWinner> LottoWinners = await _httpClient.GetFromJsonAsync<List<LottoWinner>>("lotto-data/winners.json") ?? new();
        return LottoWinners;
    }

    public async Task<IEnumerable<Transaction>> GetTransactionsAsync()
    {
        IEnumerable<Transaction> Transactions = await _httpClient.GetFromJsonAsync<IEnumerable<Transaction>>("lotto-data/transactions.json") ?? default!;
        return Transactions;
    }

    public async Task<IEnumerable<Ticket>> GetTicketEntriesAsync()
    {
        IEnumerable<Ticket> LottoTicket = await _httpClient.GetFromJsonAsync<IEnumerable<Ticket>>("lotto-data/tickets.json") ?? default!;
        return LottoTicket;
    }
}
