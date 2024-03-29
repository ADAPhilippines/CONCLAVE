using Conclave.Common.Enums;
using Conclave.Common.Models;

namespace Conclave.Api.Interfaces;

public interface IConclaveOwnerRewardService : IRepository<ConclaveOwnerReward, Guid>
{
    IEnumerable<ConclaveOwnerReward>? GetAllByEpochNumber(ulong epochNumber);
    IEnumerable<ConclaveOwnerReward>? GetAllByStakeAddress(string stakeAddress);
    PendingReward GetPendingRewardsAsync(string stakeAddress);
    ConclaveOwnerReward? GetByStakeAddressAndEpochNumber(string stakeAddress, ulong epochNumber);
    IEnumerable<ConclaveOwnerReward>? GetAllByAirdropStatus(AirdropStatus status);
}