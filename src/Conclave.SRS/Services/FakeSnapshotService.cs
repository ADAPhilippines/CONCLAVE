using Conclave.Common.Models;
using Conclave.Data;
using Microsoft.EntityFrameworkCore;

namespace Conclave.SRS.Services;

public class FakeSnapshotService
{
    private readonly ILogger<FakeSnapshotService> _logger;
    private readonly ConclaveCoreDbContext _coreDbContext;

    public FakeSnapshotService(ILogger<FakeSnapshotService> logger, ConclaveCoreDbContext coreDbContext)
    {
        _logger = logger;
        _coreDbContext = coreDbContext;
    }

    public async Task<FakeData> GetDataAsync() => await Task.Run<FakeData>(() => new() { FakeProperty = Guid.NewGuid().ToString() });

    public async Task SaveDataAsync(FakeData fakeData)
    {
        await _coreDbContext.AddAsync(fakeData);
        await _coreDbContext.SaveChangesAsync();
    }

    public async Task<int> GetCountAsync()
    {
        if (_coreDbContext.FakeData != null)
        {
            return await _coreDbContext.FakeData.CountAsync();
        }
        return 0;
    }
}