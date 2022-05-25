using Conclave.Api.Interfaces.Services;
using Conclave.Common.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Conclave.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class RewardCalculationController : ControllerBase
{
    private readonly IConclaveRewardCalculationService _service;
    private readonly IConclaveEpochsService _epochService;
    private readonly IConclaveEpochRewardService _epochRewardService;
    private readonly IConclaveEpochDelegatorRewardService _epochDelegatorRewardService;

    public RewardCalculationController(IConclaveRewardCalculationService service,
                                       IConclaveEpochsService epochService,
                                       IConclaveEpochRewardService epochRewardService,
                                       IConclaveEpochDelegatorRewardService epochDelegatorRewardService)
    {
        _service = service;
        _epochService = epochService;
        _epochRewardService = epochRewardService;
        _epochDelegatorRewardService = epochDelegatorRewardService;
    }

    [HttpPut("delegator/percentage/{epochNumber}")]
    public async Task<IActionResult> UpdateAllDelegatorPercentage(ulong epochNumber)
    {
        try
        {
            var percentages =
                await _service.CalculateAllRewardSharePercentageByEpochAsync(epochNumber);

            return Ok(percentages);
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }

    [HttpPut("delegator/token/{epochNumber}")]
    public async Task<IActionResult> UpdateAllDelegatorToken(ulong epochNumber)
    {
        try
        {
            var conclaveDelegatorRewards =
                await _service.CalculateAllConclaveTokenShareByEpochAsync(epochNumber);
            return Ok(conclaveDelegatorRewards);
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }
}