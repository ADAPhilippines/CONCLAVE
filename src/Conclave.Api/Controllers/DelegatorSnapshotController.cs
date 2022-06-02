using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Microsoft.AspNetCore.Mvc;

namespace Conclave.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class DelegatorSnapshotController : ControllerBase
{
    private readonly IDelegatorSnapshotService _delegatorSnapshotService;

    public DelegatorSnapshotController(
        IDelegatorSnapshotService delegatorSnapshotService)
    {
        _delegatorSnapshotService = delegatorSnapshotService;
    }

    [HttpPost("delegatorsnapshot/create")]
    public async Task<IActionResult> CreateAsync(DelegatorSnapshot delegatorSnapshot)
    {
        var result = await _delegatorSnapshotService.CreateAsync(delegatorSnapshot);
        return Ok(result);
    }

    [HttpDelete("delegatorsnapshot/delete/{id}")]
    public async Task<ActionResult> DeleteAsync(Guid id)
    {
        var result = await _delegatorSnapshotService.DeleteAsync(id);
        return Ok(result);
    }

    [HttpGet("delegatorsnapshot/all")]
    public IActionResult GetAll()
    {
        var result = _delegatorSnapshotService.GetAll().ToList();
        return Ok(result);
    }

    [HttpGet("delegatorsnapshot/{id}")]
    public IActionResult GetById(Guid id)
    {
        var result = _delegatorSnapshotService.GetById(id);
        return Ok(result);
    }

    [HttpPut("delegatorsnapshot/update/{id}")]
    public async Task<IActionResult> UpdateAsync(DelegatorSnapshot delegatorSnapshot)
    {
        var result = await _delegatorSnapshotService.UpdateAsync(delegatorSnapshot.Id, delegatorSnapshot);
        return Ok(result);
    }

    [HttpGet("delegatorsnapshot/epoch/{epochNumber}")]
    public IActionResult GetAllByEpochNumber(ulong epochNumber)
    {
        var result = _delegatorSnapshotService.GetAllByEpochNumber(epochNumber);
        return Ok(result);
    }

}