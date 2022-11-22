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
        var data = await _httpClient.GetFromJsonAsync<List<Session>>("lotto-data/sessions.json");

        return data ?? new();
    }
}
