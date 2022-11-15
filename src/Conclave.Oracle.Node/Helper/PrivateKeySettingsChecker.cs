using Newtonsoft.Json;

namespace Conclave.Oracle.Node.Helpers;

public static class SettingsHelpers
{
    public static void AddOrUpdateAppSetting<T>(string sectionPathKey, T value)
    {
        try
        {
            var filePath = Path.GetFullPath("appsettings.Development.json");
            string json = File.ReadAllText(filePath);
            dynamic? jsonObj = JsonConvert.DeserializeObject(json);
            ArgumentNullException.ThrowIfNullOrEmpty(jsonObj);

            SetValueRecursively(sectionPathKey, jsonObj, value);

            string output = Newtonsoft.Json.JsonConvert.SerializeObject(jsonObj, Newtonsoft.Json.Formatting.Indented);
            File.WriteAllText(filePath, output);

        }
        catch (Exception ex)
        {
            Console.WriteLine("Error writing app settings | {0}", ex.Message);
        }
    }

    private static void SetValueRecursively<T>(string sectionPathKey, dynamic jsonObj, T value)
    {
        // split the string at the first ':' character
        var remainingSections = sectionPathKey.Split(":", 2);

        var currentSection = remainingSections[0];
        if (remainingSections.Length > 1)
        {
            // continue with the procress, moving down the tree
            var nextSection = remainingSections[1];
            SetValueRecursively(nextSection, jsonObj[currentSection], value);
        }
        else
        {
            // we've got to the end of the tree, set the value
            jsonObj[currentSection] = value;
        }
    }

}