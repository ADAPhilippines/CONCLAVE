using Microsoft.AspNetCore.Components;
using MudBlazor;
namespace Conclave.Lotto.Web.Components;

public partial class CountdownTimer
{
    [Parameter]
    public int Interval { get; set; }

    [Parameter]
    public string ContainerType { get; set; } = "Card";

    private string PaperSize => ContainerType == "Card" ? "35px" : "50px";

    private Typo TextSize => ContainerType == "Card" ? Typo.body2 : Typo.h5;

    public int Hours { get; set; }

    public int Minutes { get; set; }

    public int Seconds { get; set; }

    public int Value { get; set; } = 0;

    public int MaxValue { get; set; }

    protected async override Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            MaxValue = Interval + 1;
            _ = Task.Run(async () =>
            {
                while (Interval >= 0)
                {
                    await Task.Delay(1000);
                    await BreakdownTime(Interval);
                }
            });
        }
        await base.OnAfterRenderAsync(firstRender);
    }

    private async Task BreakdownTime(int interval)
    {
        Hours = interval / 3600;
        Minutes = (interval % 3600) / 60;
        Seconds = (interval % 3600) % 60;
        Interval--;
        Value++;

        await InvokeAsync(StateHasChanged);
    }
}