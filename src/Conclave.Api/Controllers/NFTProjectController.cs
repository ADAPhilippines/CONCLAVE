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

    [HttpGet]
    public IActionResult GetAll()
    {
        var result = _nftProjectService.GetAll();

        return Ok(result);
    }

    [HttpGet("group/{id}")]
    public IActionResult GetAllByNFTGroup(Guid id)
    {
        var result = _nftProjectService.GetAllByNFTGroup(id);

        return Ok(result);
    }

    [HttpGet("{id}")]
    public IActionResult GetById(Guid id)
    {
        var result = _nftProjectService.GetById(id);

        return Ok(result);
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

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _nftProjectService.DeleteAsync(id);

        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update(Guid id, NFTProject entity)
    {
        var result = await _nftProjectService.UpdateAsync(id, entity);

        return Ok(result);
    }
}