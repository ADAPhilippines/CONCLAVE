using Conclave.Api.Interfaces;
using Conclave.Api.Interfaces.Services;
using Conclave.Common.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Conclave.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class RewardCalculationController : ControllerBase
{
    private readonly IConclaveRewardCalculationService _rewardCalculationservice;
    private readonly IConclaveEpochsService _epochService;
    private readonly IConclaveEpochRewardService _epochRewardService;
    private readonly IConclaveEpochDelegatorRewardService _epochDelegatorRewardService;

    public RewardCalculationController(
        IConclaveRewardCalculationService service,
        IConclaveEpochsService epochService,
        IConclaveEpochRewardService epochRewardService,
        IConclaveEpochDelegatorRewardService epochDelegatorRewardService)
    {
        _rewardCalculationservice = service;
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
                await _rewardCalculationservice.CalculateAllRewardSharePercentageByEpochAsync(epochNumber);

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
                await _rewardCalculationservice.CalculateAllConclaveTokenShareByEpochAsync(epochNumber);
            return Ok(conclaveDelegatorRewards);
        }
        catch (Exception e)
        {
            return BadRequest(e.Message);
        }
    }

    [HttpGet("delegator/adaReward/{epochNumber}")]
    public async Task<IActionResult> GetAdaRewardsPerEpoch(ulong epochNumber)
    {
        return BadRequest("Not Implemented");
    }
}