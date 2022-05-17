using Microsoft.EntityFrameworkCore;

namespace Conclave.Snapshot.Server.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions options) : base(options)
    {
        
    }
}