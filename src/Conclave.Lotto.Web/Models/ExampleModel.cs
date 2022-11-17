using System.ComponentModel.DataAnnotations;

namespace Conclave.Lotto.Web.Models;
public class ExampleModel
{
    [Required]
    // [StringLength(10, ErrorMessage = "Name is too long.")]
    public string? Name { get; set; }
    public string? LastName { get; set; }

}