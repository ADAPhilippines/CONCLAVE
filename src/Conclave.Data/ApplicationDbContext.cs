using Conclave.Common.Models;
using Microsoft.EntityFrameworkCore;

namespace Conclave.Data;

public class ApplicationDbContext : DbContext
{

    public ApplicationDbContext(DbContextOptions options) : base(options)
    {

    }

    public DbSet<ConclaveEpoch> ConclaveEpochs => Set<ConclaveEpoch>();
    public DbSet<ConclaveSnapshot> ConclaveSnapshots => Set<ConclaveSnapshot>();
    public DbSet<ConclaveDelegator> ConclaveDelegators => Set<ConclaveDelegator>();
}