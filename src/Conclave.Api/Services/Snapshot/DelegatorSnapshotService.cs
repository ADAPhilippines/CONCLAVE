using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Conclave.Data;
using Microsoft.EntityFrameworkCore;

namespace Conclave.Api.Services;

public class DelegatorSnapshotService : IDelegatorSnapshotService
{
    private readonly ApplicationDbContext _context;

    public DelegatorSnapshotService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<DelegatorSnapshot> CreateAsync(DelegatorSnapshot entity)
    {
        _context.Add(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public async Task<DelegatorSnapshot?> DeleteAsync(Guid id)
    {
        var entity = _context.DelegatorSnapshots.Find(id);

        if (entity is null) return null;

        _context.Remove(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public IEnumerable<DelegatorSnapshot> GetAll() => _context.DelegatorSnapshots.ToList();
    
    public IEnumerable<DelegatorSnapshot> GetAllByEpochNumber(ulong epochNumber)
    {
        var delegators = _context.DelegatorSnapshots.Include(d => d.ConclaveEpoch)
                                                    .Where(d => d.ConclaveEpoch.EpochNumber == epochNumber)
                                                    .ToList();

        return delegators ?? new List<DelegatorSnapshot>();
    }

    public DelegatorSnapshot? GetById(Guid id) => _context.DelegatorSnapshots.Find(id);
    
    public async Task<DelegatorSnapshot?> UpdateAsync(Guid id, DelegatorSnapshot entity)
    {
        var existing = _context.DelegatorSnapshots.Find(id);

        if (existing is null) return null;

        _context.Update(entity);
        await _context.SaveChangesAsync();

        return entity;
    }
}