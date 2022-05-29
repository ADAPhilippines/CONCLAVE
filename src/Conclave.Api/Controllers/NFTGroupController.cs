using Conclave.Api.Interfaces;
using Conclave.Common.Models;
using Microsoft.AspNetCore.Mvc;

namespace Conclave.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class NFTGroupController : ControllerBase
{

    private readonly INFTGroupService _service;

    public NFTGroupController(INFTGroupService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Create(string name)
    {

        var nftGroup = new NFTGroup()
        {
            Name = name
        };

        var result = await _service.CreateAsync(nftGroup);

        return Ok(result);
    }
}