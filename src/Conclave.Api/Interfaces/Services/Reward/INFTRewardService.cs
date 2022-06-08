using Conclave.Common.Models;

namespace Conclave.Api.Interfaces;

public interface INFTRewardService : IRepository<NFTReward, Guid>
{
    IEnumerable<NFTReward>? GetAllByEpochNumber(ulong epochNumber);
    IEnumerable<NFTReward>? GetAllByStakeAddress(string stakeAddress);
    IEnumerable<NFTReward>? GetAllByStakeAddressAndEpochNumber(string stakeAddress, ulong epochNumber);
}