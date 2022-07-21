using Conclave.Api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Conclave.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class RewardController : ControllerBase
{
    private readonly IConclaveRewardService _service;

    public RewardController(IConclaveRewardService service)
    {
        _service = service;
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
}