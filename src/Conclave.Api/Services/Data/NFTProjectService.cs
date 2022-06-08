using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Conclave.Data;
using Microsoft.EntityFrameworkCore;

namespace Conclave.Api.Services;

public class NFTProjectService : INFTProjectService
{
    private readonly ApplicationDbContext _context;

    public NFTProjectService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<NFTProject> CreateAsync(NFTProject entity)
    {
        _context.Add(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public async Task<NFTProject?> DeleteAsync(Guid id)
    {
        var entity = _context.NFTProjects.Find(id);

        if (entity is null) return null;

        _context.Remove(entity);
        await _context.SaveChangesAsync();

        return entity;
    }

    public IEnumerable<NFTProject>? GetAll()
    {
        return _context.NFTProjects.Include(n => n.NFTGroup).ToList();
    }

    public IEnumerable<NFTProject>? GetAllByNFTGroup(Guid nftGroupId)
    {
        return _context.NFTProjects.Include(n => n.NFTGroup).Where(n => n.NFTGroup.Id == nftGroupId).ToList();
    }

    public NFTProject? GetById(Guid id)
    {
        return _context.NFTProjects.Find(id);
    }

    public async Task<NFTProject?> UpdateAsync(Guid id, NFTProject entity)
    {
        var existing = _context.NFTProjects.Find(id);

        if (existing is null) return null;

        entity.DateUpdated = DateUtils.DateTimeToUtc(DateTime.Now);
        _context.Update(entity);
        await _context.SaveChangesAsync();

        return entity;
    }
}