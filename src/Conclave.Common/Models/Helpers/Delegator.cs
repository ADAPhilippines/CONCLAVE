namespace Conclave.Common.Models;


public class Delegator
{
    public string? StakeId { get; set; }
    public ulong LovelacesAmount { get; set; }

    public Delegator(string stakeId, ulong loveLacesAmount)
    {
        StakeId = stakeId;
        LovelacesAmount = loveLacesAmount;
    }
}