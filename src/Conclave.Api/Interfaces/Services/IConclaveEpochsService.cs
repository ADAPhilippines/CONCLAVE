using Conclave.Common.Enums;
using Conclave.Common.Models;

namespace Conclave.Api.Interfaces.Services;


public interface IConclaveEpochsService
{
    // READ
    Task<ConclaveEpoch?> GetById(Guid id);
    Task<ConclaveEpoch?> GetByEpochNumber(ulong epochNumber);
    Task<IEnumerable<ConclaveEpoch?>> GetByEpochStatus(EpochStatus epochStatus);
    Task<IEnumerable<ConclaveEpoch?>> GetBySnapshotStatus(SnapshotStatus snapshotStatus);
    Task<IEnumerable<ConclaveEpoch?>> GetByRewardStatus(RewardStatus rewardStatus);
    Task<IEnumerable<ConclaveEpoch?>> GetByAirdropStatus(AirdropStatus airdropStatus);
    Task<IEnumerable<ConclaveEpoch?>> GetByAllStatus(EpochStatus epochStatus,
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