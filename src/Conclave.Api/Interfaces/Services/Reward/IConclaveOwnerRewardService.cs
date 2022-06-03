using Conclave.Common.Models;

namespace Conclave.Api.Interfaces;

public interface IConclaveOwnerRewardService : IRepository<ConclaveOwnerReward, Guid>
{
    IEnumerable<ConclaveOwnerReward>? GetAllByEpochNumber(ulong epochNumber);
    IEnumerable<ConclaveOwnerReward>? GetAllByStakeAddress(string stakeAddress);
    ConclaveOwnerReward? GetByStakeAddressAndEpochNumber(string stakeAddress, ulong epochNumber);
}