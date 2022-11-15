using Microsoft.AspNetCore.Components;
using MudBlazor;
namespace Conclave.Lotto.Web.Components;

public partial class CombinationResult
{
    [Parameter]
    public string ContainerType { get; set; } = "Card";

    private string PaperSize => ContainerType == "Card" ? "35px" : "70px";

    private Typo TextSize => ContainerType == "Card" ? Typo.h5 : Typo.h3;
}