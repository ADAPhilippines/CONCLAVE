using Conclave.Oracle.Node.Models;

namespace Conclave.Oracle.Node.Constants;

public static class NetworkConstants
{
    public static NetworkBase Mainnet = new NetworkBase(1596059091000, 4492800, 1000);
    public static NetworkBase Testnet = new NetworkBase(1595967616000, 1598400, 1000);
    public static NetworkBase Preview = new NetworkBase(1666656000000, 0, 1000);
    public static NetworkBase Preprod = new NetworkBase(1654041600000 + 1728000000, 86400, 1000);
}