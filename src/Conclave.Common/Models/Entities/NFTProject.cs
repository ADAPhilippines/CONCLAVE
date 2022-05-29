namespace Conclave.Common.Models;

public class NFTProject
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public NFTGroup NFTGroup { get; set; } = new();
    public string PolicyId { get; set; } = string.Empty;
    public int Weight { get; set; }
}