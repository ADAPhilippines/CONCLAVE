using Microsoft.AspNetCore.Components;
using MudBlazor;
namespace Conclave.Lotto.Web.Components;

public partial class CountdownTimer
{
    [Parameter]
    public DateTime? StartDateTime { get; set; }

    [Parameter]
    public DateTime? DateCreated { get; set; }

    [Parameter]
    public string ContainerType { get; set; } = "Card";

    private string PaperSize => ContainerType == "Card" ? "35px" : "50px";

    private Typo TextSize => ContainerType == "Card" ? Typo.body2 : Typo.h5;

    private TimeSpan TimeInterval { get; set; }

    private int IntervalInSeconds { get; set; }

    private double MinValue { get; set; }

    private double CurrentValue { get; set; }

    private double MaxValue { get; set; }

    protected async override Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            MinValue = DateCreated.Value.ToOADate();
            MaxValue = StartDateTime.Value.ToOADate();

            Console.WriteLine($"MinValue: {MinValue}, MaxValue: {MaxValue}, CurrentValue: {CurrentValue}");
            _ = Task.Run(async () =>
            {
                IntervalInSeconds = Convert.ToInt32(StartDateTime.Value.Subtract(DateTime.UtcNow).TotalSeconds);
                while (IntervalInSeconds >= 0)
                {
                    await Task.Delay(1000);
                    CurrentValue = DateTime.UtcNow.ToOADate();
                    TimeInterval = StartDateTime.Value.Subtract(DateTime.UtcNow).Duration();
                    await InvokeAsync(StateHasChanged);
                }
            });
        }
        await base.OnAfterRenderAsync(firstRender);
    }

    private string HideSectionsInCard(){
        if(ContainerType == "Card")
            return "hidden";
        return "block";
    }
}