using Conclave.Api.Interfaces;
using Conclave.Common.Models;
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

    [HttpPost("conclaveownersnapshot/create")]
    public async Task<IActionResult> CreateAsync(ConclaveOwnerSnapshot conclaveOwnerSnapshot)
    {
        var result = await _conclaveOwnerSnapshotService.CreateAsync(conclaveOwnerSnapshot);
        return Ok(result);
    }

    [HttpDelete("conclaveownersnapshot/delete/{id}")]
    public async Task<ActionResult> DeleteAsync(Guid id)
    {
        var result = await _conclaveOwnerSnapshotService.DeleteAsync(id);
        return Ok(result);
    }

    [HttpGet("conclaveownersnapshot/all")]
    public IActionResult GetAll()
    {
        var result = _conclaveOwnerSnapshotService.GetAll().ToList();
        return Ok(result);
    }

    [HttpGet("conclaveownersnapshot/{id}")]
    public IActionResult GetById(Guid id)
    {
        var result = _conclaveOwnerSnapshotService.GetById(id);
        return Ok(result);
    }

    [HttpPut("conclaveownersnapshot/update/{id}")]
    public async Task<IActionResult> UpdateAsync(ConclaveOwnerSnapshot conclaveOwnerSnapshot)
    {   
        var result = await _conclaveOwnerSnapshotService.UpdateAsync(conclaveOwnerSnapshot.Id, conclaveOwnerSnapshot);
        return Ok(result);
    }

    [HttpGet("conclaveownersnapshot/epoch/{epochNumber}")]
    public IActionResult GetAllByEpochNumber(ulong epochNumber)
    {
        var result = _conclaveOwnerSnapshotService.GetAllByEpochNumber(epochNumber);
        return Ok(result);
    }
}