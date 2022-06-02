using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Microsoft.AspNetCore.Mvc;

namespace Conclave.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class NFTRewardController : ControllerBase
{
    private readonly INFTRewardService _nftRewardService;

    public NFTRewardController(INFTRewardService nFTRewardService)
    {
        _nftRewardService = nFTRewardService;
    }

    [HttpPost("nftreward/create")]
    public async Task<IActionResult> CreateAsync(NFTReward nftReward)
    {
        var result = await _nftRewardService.CreateAsync(nftReward);
        return Ok(result);
    }

    [HttpDelete("nftreward/delete/{id}")]
    public async Task<ActionResult> DeleteAsync(Guid id)
    {
        var result = await _nftRewardService.DeleteAsync(id);
        return Ok(result);
    }

    [HttpGet("nftreward/all")]
    public IActionResult GetAll()
    {
        var result = _nftRewardService.GetAll().ToList();
        return Ok(result);
    }

    [HttpGet("nftreward/{id}")]
    public IActionResult GetById(Guid id)
    {
        var result = _nftRewardService.GetById(id);
        return Ok(result);
    }

    [HttpPut("nftreward/update/{id}")]
    public async Task<IActionResult> Update(NFTReward nftReward)
    {
        var result = await _nftRewardService.UpdateAsync(nftReward.Id, nftReward);
        return Ok(result);
    }

}