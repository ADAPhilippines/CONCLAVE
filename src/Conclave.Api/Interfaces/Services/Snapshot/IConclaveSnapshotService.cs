using Conclave.Common.Models;

namespace Conclave.Api.Interfaces;


public interface IConclaveSnapshotService
{
    Task<IEnumerable<DelegatorSnapshot>> SnapshotDelegatorsAsync(string poolId, ConclaveEpoch epoch);
    Task<IEnumerable<DelegatorSnapshot>> SnapshotDelegatorsAsync(IEnumerable<string> poolIds, ConclaveEpoch epoch);
    Task<NFTSnapshot?> SnapshotNFTsForStakeAddressAsync(NFTProject nftProject, DelegatorSnapshot delegatorSnapshot, ConclaveEpoch epoch);
    Task<IEnumerable<NFTSnapshot>> SnapshotNFTsForStakeAddressesAsync(IEnumerable<NFTProject> nftProjects, IEnumerable<DelegatorSnapshot> delegatorSnapshots, ConclaveEpoch epoch);
    Task<OperatorSnapshot> SnapshotOperatorAsync(string poolId, ConclaveEpoch epoch);
    Task<IEnumerable<OperatorSnapshot>> SnapshotOperatorsAsync(IEnumerable<string> poolIds, ConclaveEpoch epoch);
    Task<IEnumerable<ConclaveOwnerSnapshot>> SnapshotConclaveOwnersAsync(string policyId, IEnumerable<DelegatorSnapshot> delegatorSnapshots, ConclaveEpoch epoch);
    Task<ConclaveOwnerSnapshot?> SnapshotConclaveOwner(DelegatorSnapshot delegatorSnapshot, string policyId, ConclaveEpoch epoch);
}