using Conclave.Common.Models;

namespace Conclave.Api.Interfaces.Services;

public interface IConclaveEpochRewardService
{

    Task<ConclaveEpochReward> CreateAsync(ConclaveEpochReward conclaveEpochReward);
}