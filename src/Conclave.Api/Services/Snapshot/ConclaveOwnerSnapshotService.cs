using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Conclave.Data;

namespace Conclave.Api.Services;

public class ConclaveOwnerSnapshotService : IConclaveOwnerSnapshotService
{

    private readonly ApplicationDbContext _context;

    public ConclaveOwnerSnapshotService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ConclaveOwnerSnapshot> CreateAsync(ConclaveOwnerSnapshot entity)
    {
        _context.Add(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public async Task<ConclaveOwnerSnapshot?> DeleteAsync(Guid id)
    {
        var entity = _context.ConclaveOwnerSnapshots.Find(id);

        if (entity is null) return null;

        _context.Remove(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public IEnumerable<ConclaveOwnerSnapshot>? GetAll()
    {
        return _context.ConclaveOwnerSnapshots.ToList();
    }

    public ConclaveOwnerSnapshot? GetById(Guid id)
    {
        return _context.ConclaveOwnerSnapshots.Find(id);
    }

    public async Task<ConclaveOwnerSnapshot?> UpdateAsync(Guid id, ConclaveOwnerSnapshot entity)
    {
        var existing = _context.ConclaveOwnerSnapshots.Find(id);

        if (existing is null) return null;

        _context.Update(entity);
        await _context.SaveChangesAsync();

        return entity;
    }
}