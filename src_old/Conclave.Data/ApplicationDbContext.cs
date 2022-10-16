using Conclave.Common.Models;
using Microsoft.EntityFrameworkCore;

namespace Conclave.Data;

public class ApplicationDbContext : DbContext
{

    public ApplicationDbContext(DbContextOptions options) : base(options)
    {

    }

    public DbSet<ConclaveEpoch> ConclaveEpochs => Set<ConclaveEpoch>();
    public DbSet<DelegatorSnapshot> DelegatorSnapshots => Set<DelegatorSnapshot>();
    public DbSet<OperatorSnapshot> OperatorSnapshots => Set<OperatorSnapshot>();
    public DbSet<ConclaveOwnerSnapshot> ConclaveOwnerSnapshots => Set<ConclaveOwnerSnapshot>();
    public DbSet<NFTSnapshot> NFTSnapshots => Set<NFTSnapshot>();
    public DbSet<NFTGroup> NFTGroups => Set<NFTGroup>();
    public DbSet<NFTProject> NFTProjects => Set<NFTProject>();
    public DbSet<DelegatorReward> DelegatorRewards => Set<DelegatorReward>();
    public DbSet<OperatorReward> OperatorRewards => Set<OperatorReward>();
    public DbSet<ConclaveOwnerReward> ConclaveOwnerRewards => Set<ConclaveOwnerReward>();
    public DbSet<NFTReward> NFTRewards => Set<NFTReward>();
}