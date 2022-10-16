using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Conclave.Common.Utils;
using Microsoft.AspNetCore.Mvc;

namespace Conclave.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class OperatorRewardController : ControllerBase
{
    private readonly IOperatorRewardService _service;

    public OperatorRewardController(IOperatorRewardService service)
    {
        _service = service;
    }

    [HttpGet]
    public IActionResult GetAll()
    {
        var result = _service.GetAll();

        return Ok(result);
    }

    [HttpGet("{id}")]
    public IActionResult GetById(Guid id)
    {
        var result = _service.GetById(id);

        return Ok(result);
    }

    [HttpGet("epoch/{epochNumber}")]
    public IActionResult GetByAllEpochNumber(ulong epochNumber)
    {
        var result = _service.GetAllByEpochNumber(epochNumber);

        return Ok(result);
    }

    [HttpGet("epoch/{epochNumber}/{stakeAddress}")]
    public IActionResult GetByEpochNumberAndStakeAddress(ulong epochNumber, string stakeAddress)
    {
        var result = _service.GetByStakeAddressAndEpochNumber(stakeAddress, epochNumber);

        return Ok(result);
    }

    [HttpGet("stake/{stakeAddress}")]
    public IActionResult GetAllByStakeAddress(string stakeAddress)
    {
        var result = _service.GetAllByStakeAddress(stakeAddress);

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create(OperatorReward entity)
    {
        var result = await _service.CreateAsync(entity);

        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _service.DeleteAsync(id);

        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, OperatorReward entity)
    {
        entity.DateUpdated = DateUtils.AddOffsetToUtc(DateTime.UtcNow);
        var result = await _service.UpdateAsync(id, entity);

        return Ok(result);
    }
}