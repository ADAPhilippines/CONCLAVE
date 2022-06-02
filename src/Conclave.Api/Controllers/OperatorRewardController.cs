using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Microsoft.AspNetCore.Mvc;

namespace Conclave.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class OperatorRewardController : ControllerBase
{
    private readonly IOperatorRewardService _operatorRewardService;

    public OperatorRewardController(IOperatorRewardService operatorRewardService)
    {
        _operatorRewardService = operatorRewardService;
    }

    [HttpPost("operatorreward/create")]
    public async Task<IActionResult> CreateAsync(OperatorReward operatorReward)
    {
        var result = await _operatorRewardService.CreateAsync(operatorReward);
        return Ok(result);
    }

    [HttpDelete("operatorreward/delete/{id}")]
    public async Task<ActionResult> DeleteAsync(Guid id)
    {
        var result = await _operatorRewardService.DeleteAsync(id);
        return Ok(result);
    }

    [HttpGet("operatorreward/all")]
    public IActionResult GetAll()
    {
        var result = _operatorRewardService.GetAll().ToList();
        return Ok(result);
    }

    [HttpGet("operatorreward/{id}")]
    public IActionResult GetById(Guid id)
    {
        var result = _operatorRewardService.GetById(id);
        return Ok(result);
    }

    [HttpPut("operatorreward/update/{id}")]
    public async Task<IActionResult> Update(OperatorReward operatorReward)
    {
        var result = await _operatorRewardService.UpdateAsync(operatorReward.Id, operatorReward);
        return Ok(result);
    }

}