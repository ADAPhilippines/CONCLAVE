using System.Runtime;
namespace Conclave.Common.Utils;


public static class DateUtils
{
    public static DateTime UnixTimeStampToDateTime(long unixTimeStamp)
    {
        // Unix timestamp is seconds past epoch
        DateTime dateTime = new(1970, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc);
        var dateoffset = DateTimeOffset.Now.Offset;
        dateTime = dateTime.AddSeconds(unixTimeStamp + dateoffset.TotalSeconds);
        return dateTime;
    }

    public static DateTime DateTimeToUtc(DateTime dateTime)
    {
        dateTime = DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);
        return dateTime;
    }
}