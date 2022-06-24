using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Microsoft.AspNetCore.Mvc;

namespace Conclave.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ConclaveOwnerSnapshotController : ControllerBase
{
    private readonly IConclaveOwnerSnapshotService _conclaveOwnerSnapshotService;

    public ConclaveOwnerSnapshotController(
        IConclaveOwnerSnapshotService conclaveOwnerSnapshotService)
    {
        _conclaveOwnerSnapshotService = conclaveOwnerSnapshotService;
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateAsync(ConclaveOwnerSnapshot entity)
    {
        var result = await _conclaveOwnerSnapshotService.CreateAsync(entity);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteAsync(Guid id)
    {
        var result = await _conclaveOwnerSnapshotService.DeleteAsync(id);
        return Ok(result);
    }

    [HttpGet]
    public IActionResult GetAll()
    {
        var result = _conclaveOwnerSnapshotService.GetAll();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public IActionResult GetById(Guid id)
    {
        var result = _conclaveOwnerSnapshotService.GetById(id);
        return Ok(result);
    }

    [HttpPut("update")]
    public async Task<IActionResult> UpdateAsync(ConclaveOwnerSnapshot entity)
    {   

        entity.DateUpdated = DateUtils.AddOffsetToUtc(DateTime.UtcNow);
        var result = await _conclaveOwnerSnapshotService.UpdateAsync(entity.Id, entity);
        return Ok(result);
    }

    [HttpGet("epoch/{epochNumber}")]
    public IActionResult GetAllByEpochNumber(ulong epochNumber)
    {
        var result = _conclaveOwnerSnapshotService.GetAllByEpochNumber(epochNumber);
        return Ok(result);
    }
}