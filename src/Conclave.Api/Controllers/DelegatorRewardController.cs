using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Microsoft.AspNetCore.Mvc;

namespace Conclave.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class DelegatorRewardController : ControllerBase
{
    private readonly IDelegatorRewardService _delegatorRewardService;

    private readonly IDelegatorSnapshotService _delegatorSnapshotService;

    public DelegatorRewardController(
        IDelegatorRewardService delegatorRewardService,
        IDelegatorSnapshotService delegatorSnapshotService)
    {
        _delegatorRewardService = delegatorRewardService;
        _delegatorSnapshotService = delegatorSnapshotService;
    }

    [HttpPost("delegatorreward/create")]
    public async Task<IActionResult> CreateAsync(DelegatorReward delegatorReward)
    {
        var result = await _delegatorRewardService.CreateAsync(delegatorReward);
        return Ok(result);
    }

    [HttpDelete("delegatorreward/delete/{id}")]
    public async Task<ActionResult> DeleteAsync(Guid id)
    {
        var result = await _delegatorRewardService.DeleteAsync(id);
        return Ok(result);
    }

    [HttpGet("delegatorreward/all")]
    public IActionResult GetAll()
    {
        var result = _delegatorRewardService.GetAll().ToList();
        return Ok(result);
    }

    [HttpGet("delegatorreward/{id}")]
    public IActionResult GetById(Guid id)
    {
        var result = _delegatorRewardService.GetById(id);
        return Ok(result);
    }

    [HttpPut("delegatorreward/update/{id}")]
    public IActionResult Update(DelegatorReward delegatorReward)
    {   
        var result = _delegatorRewardService.UpdateAsync(delegatorReward.Id, delegatorReward);
        return Ok(result);
    }

}