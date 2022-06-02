using Conclave.Common.Models;

namespace Conclave.Api.Interfaces;

public interface IConclaveAirdropService
{
    public IEnumerable<DelegatorReward>? GetAllUnpaidDelegatorRewards();
    public IEnumerable<OperatorReward>? GetAllUnpaidOperatorRewards();
    public IEnumerable<NFTReward>? GetAllUnpaidNFTRewards();
    public IEnumerable<ConclaveOwnerReward>? GetAllUnpaidConclaveOwnerRewards();
}