namespace Conclave.Snapshot.Server.Utils;


public static class DateUtils
{
    public static DateTime UnixTimeStampToDateTime(long unixTimeStamp)
    {
        // Unix timestamp is seconds past epoch
        DateTime dateTime = new(1970, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc);
        dateTime = dateTime.AddSeconds(unixTimeStamp);
        return dateTime;
    }

    public static DateTime DateTimeToUtc(DateTime dateTime)
    {
        dateTime = DateTime.SpecifyKind(dateTime, DateTimeKind.Utc);
        return dateTime;
    }
}