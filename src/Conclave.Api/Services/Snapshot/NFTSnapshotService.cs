using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Conclave.Data;
using Microsoft.EntityFrameworkCore;

namespace Conclave.Api.Services;

public class NFTSnapshotService : INFTSnapshotService
{
    private readonly ApplicationDbContext _context;

    public NFTSnapshotService(ApplicationDbContext context)
    {
        _context = context;
    }
    public async Task<NFTSnapshot> CreateAsync(NFTSnapshot entity)
    {
        _context.Add(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public async Task<NFTSnapshot?> DeleteAsync(Guid id)
    {
        var entity = _context.NFTSnapshots.Find(id);

        if (entity is null) return null;

        _context.Remove(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public IEnumerable<NFTSnapshot>? GetAll()
    {
        return _context.NFTSnapshots.ToList();
    }

    public IEnumerable<NFTSnapshot>? GetAllByEpochNumber(ulong epochNumber)
    {
        var nftStakers = _context.NFTSnapshots.Include(n => n.ConclaveEpoch)
                                              .Include(n => n.DelegatorSnapshot)
                                              .Include(n => n.NFTProject.NFTGroup)
                                              .Where(n => n.ConclaveEpoch.EpochNumber == epochNumber)
                                              .ToList();

        return nftStakers;
    }

    public NFTSnapshot? GetById(Guid id)
    {
        return _context.NFTSnapshots.Find(id);
    }

    public async Task<NFTSnapshot?> UpdateAsync(Guid id, NFTSnapshot entity)
    {
        var existing = _context.NFTSnapshots.Find(id);

        if (existing is null) return null;

        _context.Update(entity);
        await _context.SaveChangesAsync();

        return entity;
    }
}