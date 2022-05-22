using System.Collections.Generic;
using System.Threading.Tasks;
using Blockfrost.Api.Services;
using Conclave.Api.Exceptions;
using Conclave.Api.Interfaces.Services;
using Conclave.Api.Options;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Conclave.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Polly;

namespace Conclave.Api.Services;

public class ConclaveSnapshotService : IConclaveSnapshotService
{
    private readonly IConclaveEpochsService _epochsService;
    private readonly ApplicationDbContext _context;

    public ConclaveSnapshotService(IConclaveEpochsService epochsService,
                                ApplicationDbContext context)
    {
        _epochsService = epochsService;
        _context = context;
    }

    public Task<ConclaveSnapshot?> CreateAsync(ConclaveSnapshot conclaveSnapshot)
    {
        throw new NotImplementedException();
    }

    public Task<ConclaveSnapshot?> DeleteAsync(Guid id)
    {
        throw new NotImplementedException();
    }

    public IEnumerable<ConclaveSnapshot?> GetByEpochNumber(ulong epochNumber)
    {
        var snapshotList = _context.ConclaveSnapshots
                            .Where(s => s.ConclaveEpoch.EpochNumber == epochNumber)
                            .ToList();

        return snapshotList;
    }

    public Task<ConclaveSnapshot?> GetById(Guid id)
    {
        throw new NotImplementedException();
    }

    public Task<IEnumerable<ConclaveSnapshot?>> GetByStakingAddress(string stakingAddress)
    {
        throw new NotImplementedException();
    }

    public Task<ConclaveSnapshot?> UpdateAsync(Guid id, ConclaveSnapshot conclaveSnapshot)
    {
        throw new NotImplementedException();
    }
}