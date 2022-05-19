namespace Conclave.Common.Models;


public class Epoch
{

    public long Number { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }

    public Epoch(long number, DateTime startTime, DateTime endTime)
    {
        Number = number;
        StartTime = startTime;
        EndTime = endTime;
    }
}