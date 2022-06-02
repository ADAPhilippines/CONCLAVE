using Conclave.Api.Interfaces;
using Conclave.Common.Models;
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

    [HttpPost("operatorsnapshot/create")]
    public async Task<IActionResult> CreateAsync(OperatorSnapshot operatorSnapshot)
    {
        var result = await _operatorSnapshotService.CreateAsync(operatorSnapshot);
        return Ok(result);
    }

    [HttpDelete("operatorsnapshot/delete/{id}")]
    public async Task<ActionResult> DeleteAsync(Guid id)
    {
        var result = await _operatorSnapshotService.DeleteAsync(id);
        return Ok(result);
    }

    [HttpGet("operatorsnapshot/all")]
    public IActionResult GetAll()
    {
        var result = _operatorSnapshotService.GetAll().ToList();
        return Ok(result);
    }

    [HttpGet("operatorsnapshot/{id}")]
    public IActionResult GetById(Guid id)
    {
        var result = _operatorSnapshotService.GetById(id);
        return Ok(result);
    }

    [HttpPut("operatorsnapshot/update/{id}")]
    public async Task<IActionResult> UpdateAsync(OperatorSnapshot operatorSnapshot)
    {
        var result = await _operatorSnapshotService.UpdateAsync(operatorSnapshot.Id, operatorSnapshot);
        return Ok(result);
    }

    [HttpGet("operatorsnapshot/epoch/{epochNumber}")]
    public IActionResult GetAllByEpochNumber(ulong epochNumber)
    {
        var result = _operatorSnapshotService.GetAllByEpochNumber(epochNumber);
        return Ok(result);
    }
}