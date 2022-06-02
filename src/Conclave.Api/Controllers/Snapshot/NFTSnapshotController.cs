using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Microsoft.AspNetCore.Mvc;

namespace Conclave.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class NFTSnapshotController : ControllerBase
{
    private readonly INFTSnapshotService _nftSnapshotService;

    public NFTSnapshotController(INFTSnapshotService nftSnapshotService)
    {
        _nftSnapshotService = nftSnapshotService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateAsync(NFTSnapshot nftSnapshot)
    {
        var result = await _nftSnapshotService.CreateAsync(nftSnapshot);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteAsync(Guid id)
    {
        var result = await _nftSnapshotService.DeleteAsync(id);
        return Ok(result);
    }

    [HttpGet]
    public IActionResult GetAll()
    {
        var result = _nftSnapshotService.GetAll();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public IActionResult GetById(Guid id)
    {
        var result = _nftSnapshotService.GetById(id);
        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateAsync(NFTSnapshot nftSnapshot)
    {
        var result = await _nftSnapshotService.UpdateAsync(nftSnapshot.Id, nftSnapshot);
        return Ok(result);
    }

    [HttpGet("epoch/{epochNumber}")]
    public IActionResult GetAllByEpochNumber(ulong epochNumber)
    {
        var result = _nftSnapshotService.GetAllByEpochNumber(epochNumber);
        return Ok(result);
    }
}