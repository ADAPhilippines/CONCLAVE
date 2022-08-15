using Conclave.Api.Interfaces;
using Conclave.Common.Enums;
using Conclave.Common.Models;
using Microsoft.AspNetCore.Mvc;

namespace Conclave.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class RewardController : ControllerBase
{
    private readonly IConclaveRewardService _service;
    private readonly ILogger<RewardController> _logger;

    public RewardController(IConclaveRewardService service, ILogger<RewardController> logger)
    {
        _service = service;
        _logger = logger;
    }

    [HttpGet("unpaid")]
    public IActionResult GetAllUnpaidRewards()
    {
        var res = _service.GetAllUnpaidRewards();
        return Ok(res);
    }

    [HttpGet("inprogress")]
    public IActionResult GetAllPendingTransactionHashes()
    {
        var res = _service.GetAllPendingTransactionHashes();
        return Ok(res);
    }

    [HttpPut("update/{txHash}/{status}")]
    public async Task<IActionResult> UpdateRewardStatus([FromBody]IEnumerable<Reward> pendingRewards, string txHash, AirdropStatus status)
    {
        _logger.LogInformation($"Updating reward status for {txHash} to {status}");

        try {
            var res = await _service.UpdateRewardStatus(pendingRewards, status, txHash);
            return Ok(res);
        } catch (Exception e) {
            return BadRequest();
        }
    }   

}