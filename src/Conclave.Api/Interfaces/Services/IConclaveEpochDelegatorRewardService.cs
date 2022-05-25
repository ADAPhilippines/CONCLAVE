using Conclave.Common.Models;

namespace Conclave.Api.Interfaces.Services;

public interface IConclaveEpochDelegatorRewardService
{

    //READ

    ConclaveEpochDelegatorReward? GetById(Guid id);
    IEnumerable<ConclaveEpochDelegatorReward?> GetByStakeAddress(string stakeAddress);
    IEnumerable<ConclaveEpochDelegatorReward?> GetByEpoch(ConclaveEpoch conclaveEpoch);
    IEnumerable<ConclaveEpochDelegatorReward?> GetByEpochNumber(ulong epochNumber);
    ulong GetTotalDelegatedLoveLaceByEpochNumber(ulong epochNumber);

    //WRITE

    Task<ConclaveEpochDelegatorReward> Create(ConclaveEpochDelegatorReward conclaveEpochDelegatorReward);
    Task<IEnumerable<ConclaveEpochDelegatorReward>> CreateAsync(IEnumerable<ConclaveEpochDelegatorReward> conclaveEpochDelegatorRewards);
    Task<ConclaveEpochDelegatorReward> Update(Guid Id, ConclaveEpochDelegatorReward conclaveEpochDelegatorReward);
    Task<ConclaveEpochDelegatorReward> Delete(Guid Id, ConclaveEpochDelegatorReward conclaveEpochDelegatorReward);
}