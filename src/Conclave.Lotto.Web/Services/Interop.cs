using System.Runtime.InteropServices.JavaScript;
using System.Runtime.Versioning;

namespace Conclave.Lotto.Web.Services;

public partial class Interop
{
    [JSImport("connectWallet", "Interop")]
    internal static partial Task<string> GetWalletAddress();
}