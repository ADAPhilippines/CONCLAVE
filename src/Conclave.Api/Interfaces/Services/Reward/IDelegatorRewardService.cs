using Conclave.Common.Models;

namespace Conclave.Api.Interfaces;

public interface IDelegatorRewardService : IRepository<DelegatorReward, Guid>
{
    IEnumerable<DelegatorReward>? GetAllByEpochNumber(ulong epochNumber);
    IEnumerable<DelegatorReward>? GetAllByStakeAddress(string stakeAddress);
    DelegatorReward? GetByStakeAddressAndEpochNumber(string stakeAddress, ulong epochNumber);
}