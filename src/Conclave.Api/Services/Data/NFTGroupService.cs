using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Conclave.Data;
namespace Conclave.Api.Services;

public class NFTGroupService : INFTGroupService
{
    private readonly ApplicationDbContext _context;

    public NFTGroupService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<NFTGroup> CreateAsync(NFTGroup entity)
    {
        _context.Add(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public async Task<NFTGroup?> DeleteAsync(Guid id)
    {
        var entity = _context.NFTGroups.Find(id);

        if (entity is null) return null;

        _context.Remove(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public IEnumerable<NFTGroup>? GetAll()
    {
        return _context.NFTGroups.ToList();
    }

    public NFTGroup? GetById(Guid id)
    {
        return _context.NFTGroups.Find(id);
    }

    public async Task<NFTGroup?> UpdateAsync(Guid id, NFTGroup entity)
    {
        var existing = _context.NFTGroups.Find(id);

        if (existing is null) return null;

        _context.Update(entity);
        await _context.SaveChangesAsync();

        return entity;
    }
}