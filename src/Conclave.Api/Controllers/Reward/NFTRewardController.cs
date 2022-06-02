using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Microsoft.AspNetCore.Mvc;

namespace Conclave.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class NFTRewardController : ControllerBase
{
    private readonly INFTRewardService _service;

    public NFTRewardController(INFTRewardService service)
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

    [HttpPost]
    public async Task<IActionResult> Create(NFTReward entity)
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

    [HttpPut]
    public async Task<IActionResult> Update(Guid id, NFTReward entity)
    {
        var result = await _service.UpdateAsync(id, entity);

        return Ok(result);
    }
}