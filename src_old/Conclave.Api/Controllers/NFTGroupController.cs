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

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _service.DeleteAsync(id);

        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update(Guid id, NFTGroup entity)
    {
        var result = await _service.UpdateAsync(id, entity);

        return Ok(result);
    }
}