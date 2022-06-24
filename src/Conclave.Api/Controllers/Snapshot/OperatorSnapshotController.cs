using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Microsoft.AspNetCore.Mvc;

namespace Conclave.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class OperatorSnapshotController : ControllerBase
{
    private readonly IOperatorSnapshotService _operatorSnapshotService;

    public OperatorSnapshotController(IOperatorSnapshotService operatorSnapshotService)
    {
        _operatorSnapshotService = operatorSnapshotService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateAsync(OperatorSnapshot entity)
    {
        var result = await _operatorSnapshotService.CreateAsync(entity);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteAsync(Guid id)
    {
        var result = await _operatorSnapshotService.DeleteAsync(id);
        return Ok(result);
    }

    [HttpGet]
    public IActionResult GetAll()
    {
        var result = _operatorSnapshotService.GetAll();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public IActionResult GetById(Guid id)
    {
        var result = _operatorSnapshotService.GetById(id);
        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateAsync(OperatorSnapshot entity)
    {
        entity.DateUpdated = DateUtils.AddOffsetToUtc(DateTime.UtcNow);
        var result = await _operatorSnapshotService.UpdateAsync(entity.Id, entity);
        return Ok(result);
    }

    [HttpGet("epoch/{epochNumber}")]
    public IActionResult GetAllByEpochNumber(ulong epochNumber)
    {
        var result = _operatorSnapshotService.GetAllByEpochNumber(epochNumber);
        return Ok(result);
    }
}