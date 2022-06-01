using Conclave.Common.Models;

namespace Conclave.Api.Interfaces;

public interface INFTProjectService : IRepository<NFTProject, Guid>
{
    IEnumerable<NFTProject> GetAllByNFTGroup(Guid nftGroupId);
}