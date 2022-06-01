using Conclave.Common.Models;

namespace Conclave.Api.Interfaces;

public interface INFTRewardService : IRepository<NFTReward, Guid>
{
    IEnumerable<NFTReward>? GetAllByEpochNumber(ulong epochNumber);
}