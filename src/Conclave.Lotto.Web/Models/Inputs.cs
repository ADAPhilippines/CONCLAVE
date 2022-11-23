using Microsoft.AspNetCore.Components;

namespace Conclave.Lotto.Web.Models;

public class Inputs
{
    public ElementReference ElementRef { get; set; }

    public string Value { get; set; } = string.Empty;
}