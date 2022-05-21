using Conclave.Common.Enums;
using Conclave.Common.Models;

namespace Conclave.Api.Interfaces.Services;


public interface IConclaveEpochsService
{
    // READ
    ConclaveEpoch? GetById(Guid id);
    ConclaveEpoch? GetByEpochNumber(ulong epochNumber);
    IEnumerable<ConclaveEpoch?> GetByEpochStatus(EpochStatus epochStatus);
    IEnumerable<ConclaveEpoch?> GetBySnapshotStatus(SnapshotStatus snapshotStatus);
    IEnumerable<ConclaveEpoch?> GetByRewardStatus(RewardStatus rewardStatus);
    IEnumerable<ConclaveEpoch?> GetByAirdropStatus(AirdropStatus airdropStatus);
    IEnumerable<ConclaveEpoch?> GetByAllStatus(EpochStatus epochStatus,
                                                     SnapshotStatus snapshotStatus,
                                                     RewardStatus rewardStatus,
                                                     AirdropStatus airdropStatus);

    // WRITE
    Task<ConclaveEpoch?> CreateAsync(ConclaveEpoch conclaveEpoch);
    Task<IEnumerable<ConclaveEpoch?>> CreateAsync(IEnumerable<ConclaveEpoch?> conclaveEpochList);
    Task<ConclaveEpoch?> Update(ConclaveEpoch conclaveEpoch);
    Task<ConclaveEpoch?> DeleteByEpochNumber(ulong epochNumber);
    Task<ConclaveEpoch?> DeleteById(Guid id);

}