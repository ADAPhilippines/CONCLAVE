using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Conclave.Data;
using Microsoft.EntityFrameworkCore;

namespace Conclave.Api.Services;

public class OperatorSnapshotService : IOperatorSnapshotService
{
    private readonly ApplicationDbContext _context;

    public OperatorSnapshotService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<OperatorSnapshot> CreateAsync(OperatorSnapshot entity)
    {
        _context.Add(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public async Task<OperatorSnapshot?> DeleteAsync(Guid id)
    {
        var entity = _context.OperatorSnapshots.Find(id);

        if (entity is null) return null;

        _context.Remove(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public IEnumerable<OperatorSnapshot> GetAll() => _context.OperatorSnapshots.ToList() ?? new List<OperatorSnapshot>();

    public IEnumerable<OperatorSnapshot> GetAllByEpochNumber(ulong epochNumber)
    {
        var operators = _context.OperatorSnapshots.Include(o => o.ConclaveEpoch)
                                                  .Where(o => o.ConclaveEpoch.EpochNumber == epochNumber)
                                                  .ToList();

        return operators ?? new List<OperatorSnapshot>();
    }


    public OperatorSnapshot? GetById(Guid id) => _context.OperatorSnapshots.Find(id);
    
    public async Task<OperatorSnapshot?> UpdateAsync(Guid id, OperatorSnapshot entity)
    {
        var existing = _context.OperatorSnapshots.Find(id);

        if (existing is null) return null;

        _context.Update(entity);
        await _context.SaveChangesAsync();

        return entity;
    }
}