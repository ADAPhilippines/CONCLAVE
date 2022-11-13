using Microsoft.AspNetCore.Components;

namespace Conclave.Lotto.Web.Components;
public partial class SessionList
{
    [Parameter] 
    public RenderFragment? ChildContent { get; set; }
}