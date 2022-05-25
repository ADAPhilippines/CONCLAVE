using Conclave.Common.Models;

namespace Conclave.Api.Interfaces.Services;

public interface IConclaveEpochRewardService
{

    // READ

    ConclaveEpochReward? GetById(Guid Id);
    ConclaveEpochReward? GetByEpochNumber(ulong epochNumber);

    // WRITE

    Task<ConclaveEpochReward> CreateAsync(ConclaveEpochReward conclaveEpochReward);
    Task<ConclaveEpochReward> UpdateAsync(Guid id, ConclaveEpochReward conclaveEpochReward);
    Task<ConclaveEpochReward> DeleteAsync(Guid id);
}