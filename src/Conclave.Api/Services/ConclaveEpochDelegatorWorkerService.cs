using Conclave.Api.Interfaces.Services;
using Conclave.Common.Models;
using Conclave.Data;
using Microsoft.EntityFrameworkCore;

namespace Conclave.Api.Services;

public class ConclaveEpochDelegatorWorkerService : IConclaveEpochDelegatorWorkerService
{
    private readonly ApplicationDbContext _context;
    private readonly IConclaveCardanoService _service;

    public ConclaveEpochDelegatorWorkerService(ApplicationDbContext context, IConclaveCardanoService service)
    {
        _context = context;
        _service = service;
    }

    public async Task<IEnumerable<ConclaveEpochDelegator?>> GetAllConclaveDelegatorsFromSnapshotListAsync(IEnumerable<ConclaveSnapshot?> snapshots)
    {
        List<ConclaveEpochDelegator> conclaveDelegators = new();
        foreach (var snapshot in snapshots)
        {
            var addresses = await _service.GetAssociatedWalletAddressAsync(snapshot!.StakingId);
            var address = addresses.FirstOrDefault();

            var conclaveDelegator = new ConclaveEpochDelegator
            {
                ConclaveSnapshot = snapshot,
                WalletAddress = address
            };

            conclaveDelegators.Add(conclaveDelegator);
        }

        return conclaveDelegators;
    }

    public async Task<IEnumerable<ConclaveEpochDelegator?>> StoreConclaveDelegatorsAsync(IEnumerable<ConclaveEpochDelegator> conclaveDelegators)
    {
        if (conclaveDelegators.Any())
        {
            _context.AddRange(conclaveDelegators);
            await _context.SaveChangesAsync();
        }

        return conclaveDelegators;
    }
}