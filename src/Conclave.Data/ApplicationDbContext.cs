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
    public DbSet<ConclaveEpochDelegator> ConclaveEpochDelegators => Set<ConclaveEpochDelegator>();
    public DbSet<ConclaveEpochReward> ConclaveEpochRewards => Set<ConclaveEpochReward>();
    public DbSet<ConclaveEpochDelegatorReward> ConclaveEpochDelegatorRewards => Set<ConclaveEpochDelegatorReward>();
    public DbSet<ConclaveHolder> ConclaveHolders => Set<ConclaveHolder>();
}