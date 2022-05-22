using Conclave.Api.Interfaces.Services;
using Conclave.Common.Models;
using Conclave.Data;

namespace Conclave.Api.Services;

public class ConclaveDelegatorWorkerService : IConclaveDelegatorWorkerService
{
    private readonly ApplicationDbContext _context;
    private readonly IConclaveCardanoService _service;

    public ConclaveDelegatorWorkerService(ApplicationDbContext context, IConclaveCardanoService service)
    {
        _context = context;
        _service = service;
    }

    public async Task<IEnumerable<ConclaveDelegator?>> GetAllConclaveDelegatorsFromSnapshotListAsync(IEnumerable<ConclaveSnapshot?> snapshots)
    {
        List<ConclaveDelegator> conclaveDelegators = new();
        foreach (var snapshot in snapshots)
        {
            var addresses = await _service.GetAssociatedWalletAddressAsync(snapshot!.StakingId);
            var address = addresses.FirstOrDefault();

            var conclaveDelegator = new ConclaveDelegator
            {
                ConclaveSnapshot = snapshot,
                WalletAddress = address
            };

            conclaveDelegators.Add(conclaveDelegator);
        }

        return conclaveDelegators;
    }

    public async Task<IEnumerable<ConclaveDelegator?>> StoreConclaveDelegatorsAsync(IEnumerable<ConclaveDelegator> conclaveDelegators)
    {
        if (conclaveDelegators.Any())
        {
            _context.AddRange(conclaveDelegators);
            await _context.SaveChangesAsync();
        }

        return conclaveDelegators;
    }
}