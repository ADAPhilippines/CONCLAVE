namespace Conclave.Oracle.Node.Helpers;

public static class LoggingHelper
{
    public static void LogWithScope<T>(ILogger<T> logger, string scope, string message, params object[] args)
    {
        using (logger.BeginScope(scope, args))
            logger.LogInformation(message);
    }

    public static void LogList<T>(ILogger<T> logger, string scope, string scopesubtype, List<object> list)
    {
        string listLog = string.Empty;
        list.ForEach((b) =>
        {
            int i = list.IndexOf(b);
            if (b == list.Last())
                listLog += string.Format("[{0}] {1}", i, b);
            else
                listLog += string.Format("[{0}] {1}\n", i, b);
        });

        using (logger.BeginScope(scope))
            using (logger.BeginScope(scopesubtype))
                logger.LogInformation(listLog);
    }
}