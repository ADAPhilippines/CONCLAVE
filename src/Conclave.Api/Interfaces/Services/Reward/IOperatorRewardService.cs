using Conclave.Common.Models;

namespace Conclave.Api.Interfaces;

public interface IOperatorRewardService : IRepository<OperatorReward, Guid>
{
    IEnumerable<OperatorReward>? GetAllByEpochNumber(ulong epochNumber);
    IEnumerable<OperatorReward>? GetAllByStakeAddress(string stakeAddress);
    OperatorReward? GetByStakeAddressAndEpochNumber(string stakeAddress, ulong epochNumber);
}