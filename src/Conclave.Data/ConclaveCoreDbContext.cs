using Conclave.Common.Models;
using Microsoft.EntityFrameworkCore;

namespace Conclave.Data;

public class ConclaveCoreDbContext : DbContext
{
    public DbSet<FakeData>? FakeData { get; set; }

    public ConclaveCoreDbContext(DbContextOptions<ConclaveCoreDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<FakeData>().Property(x => x.FakeProperty).IsRequired().HasMaxLength(1000);
    }
}
