namespace Conclave.Snapshot.Server.Models;


public class Delegator
{
    public string? StakeId { get; set; }
    public long? LovelacesAmount { get; set; }

    public Delegator(string stakeId, long loveLacesAmount)
    {
        StakeId = stakeId;
        LovelacesAmount = loveLacesAmount;
    }
}