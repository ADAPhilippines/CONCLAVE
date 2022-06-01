using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Microsoft.AspNetCore.Mvc;

namespace Conclave.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ConclaveOwnerRewardController : ControllerBase
{
    private readonly IConclaveOwnerRewardService _conclaveOwnerRewardService;

    private readonly IConclaveOwnerSnapshotService _conclaveOwnerSnapshotService;

    public ConclaveOwnerRewardController(
        IConclaveOwnerRewardService conclaveOwnerRewardService,
        IConclaveOwnerSnapshotService conclaveOwnerSnapshotService)
    {
        _conclaveOwnerRewardService = conclaveOwnerRewardService;
        _conclaveOwnerSnapshotService = conclaveOwnerSnapshotService;
    }

    [HttpPost("conclaveownerreward/create")]
    public async Task<IActionResult> CreateAsync(ConclaveOwnerReward conclaveOwnerReward)
    {
        var result = await _conclaveOwnerRewardService.CreateAsync(conclaveOwnerReward);
        return Ok(result);
    }

    [HttpDelete("conclaveownerreward/delete/{id}")]
    public async Task<ActionResult> DeleteAsync(Guid id)
    {
        var result = await _conclaveOwnerRewardService.DeleteAsync(id);
        return Ok(result);
    }

    [HttpGet("conclaveownerreward/all")]
    public IActionResult GetAll()
    {
        var result = _conclaveOwnerRewardService.GetAll().ToList();
        return Ok(result);
    }

    [HttpGet("conclaveownerreward/{id}")]
    public IActionResult GetById(Guid id)
    {
        var conclaveOwnerReward = _conclaveOwnerRewardService.GetById(id);
        return Ok(conclaveOwnerReward);
    }

    [HttpPut("conclaveownerreward/update/{id}")]
    public IActionResult Update(ConclaveOwnerReward conclaveOwnerReward)
    {   
        var result = _conclaveOwnerRewardService.UpdateAsync(conclaveOwnerReward.Id, conclaveOwnerReward);
        return Ok(result);
    }

}