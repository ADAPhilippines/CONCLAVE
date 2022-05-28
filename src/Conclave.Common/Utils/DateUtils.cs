using System.Runtime;
namespace Conclave.Common.Utils;


public static class DateUtils
{
    const int SECONDS_IN_A_MINUTE = 60;
    const int MINUTES_IN_AN_HOUR = 60;
    const int HOURS_IN_A_DAY = 24;

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

    public static long GetTimeDifferenceFromNowInMilliseconds(DateTime? dateTime)
    {
        if (dateTime is null) return 0;

        var utcNow = DateTimeToUtc(DateTime.Now);
        var difference = dateTime - utcNow;
        return (long)difference.Value.TotalMilliseconds;
    }

    public static string GetReadableTimeFromMilliseconds(int milliseconds)
    {
        var delayInHours = milliseconds / 1000.0 / SECONDS_IN_A_MINUTE / MINUTES_IN_AN_HOUR;
        var days = delayInHours / HOURS_IN_A_DAY;
        var hours = days % 1 * HOURS_IN_A_DAY;
        var minutes = hours % 1 * MINUTES_IN_AN_HOUR;
        var seconds = minutes % 1 * SECONDS_IN_A_MINUTE;

        return $"{(int)days} days {(int)hours} hours {(int)minutes} minutes {(int)seconds} seconds";

    }
}