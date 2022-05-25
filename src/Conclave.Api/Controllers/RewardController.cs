using Conclave.Api.Interfaces.Services;
using Conclave.Common.Models;
using Microsoft.AspNetCore.Mvc;

namespace Conclave.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class RewardController : ControllerBase
{
    private readonly IConclaveEpochRewardService _service;

    public RewardController(IConclaveEpochRewardService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Create(ConclaveEpochReward conclaveEpochReward)
    {
        var existingConclaveEpochReward = _service.GetByEpochNumber(conclaveEpochReward.EpochNumber);
        if (existingConclaveEpochReward is not null) return BadRequest("Epoch number already exist!");

        var totalSharePercentage = conclaveEpochReward.SPOSharePercentage + conclaveEpochReward.DelegatorSharePercentage + conclaveEpochReward.NFTSharePercentage;
        if (totalSharePercentage != 100.0) return BadRequest("Total share percentage must be equal to 100%");

        var createdEntry = await _service.CreateAsync(conclaveEpochReward);

        return Ok(createdEntry);
    }

    [HttpPut]
    public async Task<IActionResult> Update(Guid id, ConclaveEpochReward conclaveEpochReward)
    {
        if (id != conclaveEpochReward.Id) return BadRequest("Ids do not match!");

        var totalSharePercentage = conclaveEpochReward.SPOSharePercentage + conclaveEpochReward.DelegatorSharePercentage + conclaveEpochReward.NFTSharePercentage;
        if (totalSharePercentage != 100.0) return BadRequest("Total share percentage must be equal to 100%");

        var updatedEntry = await _service.UpdateAsync(id, conclaveEpochReward);

        return Ok(updatedEntry);
    }
}