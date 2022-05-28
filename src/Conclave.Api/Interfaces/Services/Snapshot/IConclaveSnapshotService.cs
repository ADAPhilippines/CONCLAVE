using Conclave.Common.Models;

namespace Conclave.Api.Interfaces;


public interface IConclaveSnapshotService
{
    Task<IEnumerable<DelegatorSnapshot>> SnapshotDelegatorsAsync(string poolId, ConclaveEpoch epoch);
    Task<IEnumerable<DelegatorSnapshot>> SnapshotDelegatorsAsync(IEnumerable<string> poolIds, ConclaveEpoch epoch);
    Task<IEnumerable<NFTSnapshot>> SnapshotNFTsAsync(NFTProject nftProject, DelegatorSnapshot delegatorSnapshot, ConclaveEpoch epoch);
    Task<IEnumerable<NFTSnapshot>> SnapshotNFTsAsync(IEnumerable<NFTProject> nftProjects, IEnumerable<DelegatorSnapshot> delegatorSnapshots, ConclaveEpoch epoch);
    Task<OperatorSnapshot> SnapshotOperatorAsync(string poolId, ConclaveEpoch epoch);
    Task<IEnumerable<OperatorSnapshot>> SnapshotOperatorsAsync(IEnumerable<string> poolIds, ConclaveEpoch epoch);
    Task<IEnumerable<ConclaveOwnerSnapshot>> SnapshotConclaveOwnersAsync(string assetAddress, IEnumerable<DelegatorSnapshot> delegatorSnapshots, ConclaveEpoch epoch);
    ConclaveOwnerSnapshot? SnapshotConclaveOwner(DelegatorSnapshot delegatorSnapshot, ConclaveEpoch epoch, IEnumerable<AssetOwner> assetOwners);
}