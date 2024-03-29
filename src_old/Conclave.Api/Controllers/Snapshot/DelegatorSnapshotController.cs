using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Conclave.Common.Utils;
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

    [HttpPost]
    public async Task<IActionResult> CreateAsync(DelegatorSnapshot entity)
    {
        var result = await _delegatorSnapshotService.CreateAsync(entity);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteAsync(Guid id)
    {
        var result = await _delegatorSnapshotService.DeleteAsync(id);
        return Ok(result);
    }

    [HttpGet]
    public IActionResult GetAll()
    {
        var result = _delegatorSnapshotService.GetAll();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public IActionResult GetById(Guid id)
    {
        var result = _delegatorSnapshotService.GetById(id);
        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateAsync(DelegatorSnapshot entity)
    {
        entity.DateUpdated = DateUtils.AddOffsetToUtc(DateTime.UtcNow);
        var result = await _delegatorSnapshotService.UpdateAsync(entity.Id, entity);
        return Ok(result);
    }

    [HttpGet("epoch/{epochNumber}")]
    public IActionResult GetAllByEpochNumber(ulong epochNumber)
    {
        var result = _delegatorSnapshotService.GetAllByEpochNumber(epochNumber);
        return Ok(result);
    }

}