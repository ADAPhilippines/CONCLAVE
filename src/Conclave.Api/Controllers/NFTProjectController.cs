using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Microsoft.AspNetCore.Mvc;

namespace Conclave.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class NFTProjectController : ControllerBase
{

    private readonly INFTProjectService _nftProjectService;
    private readonly INFTGroupService _nftGroupService;

    public NFTProjectController(INFTProjectService nftProjectService, INFTGroupService nftGroupService)
    {
        _nftProjectService = nftProjectService;
        _nftGroupService = nftGroupService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid nftGroupId, string policyId, int weight)
    {

        var nftGroup = _nftGroupService.GetById(nftGroupId);

        if (nftGroup is null) return NotFound();

        var nftProject = new NFTProject()
        {
            NFTGroup = nftGroup,
            PolicyId = policyId,
            Weight = weight
        };

        var result = await _nftProjectService.CreateAsync(nftProject);
        return Ok(result);
    }
}