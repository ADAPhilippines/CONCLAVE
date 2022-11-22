using Microsoft.AspNetCore.Components;
using MudBlazor;
namespace Conclave.Lotto.Web.Components;

public partial class CountdownTimer
{
    [Parameter]
    public DateTime StartDateTime { get; set; }

    [Parameter]
    public DateTime DateCreated { get; set; }

    [Parameter]
    public string ContainerType { get; set; } = "Card";

    private string PaperSize => ContainerType == "Card" ? "35px" : "50px";

    private Typo TextSize => ContainerType == "Card" ? Typo.body2 : Typo.h5;

    private TimeSpan TimeInterval { get; set; }

    private TimeSpan IntervalInSeconds { get; set; }

    private double CurrentValue { get; set; }

    protected async override Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {

            _ = Task.Run(async () =>
            {
                IntervalInSeconds = StartDateTime.Subtract(DateTime.UtcNow);
                while (IntervalInSeconds.TotalSeconds >= 0)
                {
                    await Task.Delay(1000);
                    // CurrentValue = DateTime.UtcNow.ToOADate();
                    CurrentValue = 12;
                    // Console.WriteLine(IntervalInSeconds.TotalSeconds);
                    TimeInterval = StartDateTime.Subtract(DateTime.UtcNow).Duration();
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