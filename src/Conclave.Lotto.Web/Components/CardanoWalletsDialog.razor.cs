using Microsoft.AspNetCore.Components;
using MudBlazor;

namespace Conclave.Lotto.Web.Components;

public partial class CardanoWalletsDialog
{
    [Inject] IDialogService? DialogService { get; set; } = default;

    [CascadingParameter] MudDialogInstance MudDialog { get; set; } = default!;
}
