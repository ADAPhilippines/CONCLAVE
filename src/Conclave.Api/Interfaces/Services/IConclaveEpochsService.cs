using Conclave.Common.Enums;
using Conclave.Common.Models;

namespace Conclave.Api.Interfaces;


public interface IConclaveEpochsService : IRepository<ConclaveEpoch, Guid>
{
    // READ
    ConclaveEpoch? GetByEpochNumber(ulong epochNumber);
    IEnumerable<ConclaveEpoch>? GetByEpochStatus(EpochStatus epochStatus);
    // IEnumerable<ConclaveEpoch> GetBySnapshotStatus(SnapshotStatus snapshotStatus);
    // IEnumerable<ConclaveEpoch> GetByRewardStatus(RewardStatus rewardStatus);
    //IEnumerable<ConclaveEpoch> GetByAirdropStatus(AirdropStatus airdropStatus);
    IEnumerable<ConclaveEpoch> GetByAllStatus(EpochStatus epochStatus, SnapshotStatus snapshotStatus,
                                              RewardStatus rewardStatus, AirdropStatus airdropStatus);

    // WRITE
    Task<ConclaveEpoch?> DeleteByEpochNumber(ulong epochNumber);
}