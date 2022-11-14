using Nethereum.Web3;
using Nethereum.Web3.Accounts;
using Conclave.EVM;
using Nethereum.RPC.Eth.DTOs;
using Nethereum.Contracts;

string abi = await File.ReadAllTextAsync("abi.json");
string privateKey = "0xb5b1870957d373ef0eeffecc6e4812c0fd08f554b37b233526acc331bf1544f7";
string contractAddress = "0xB28F2452F811161C637A886dC0dF665071eBe441";
Account account = new Account(privateKey, 200101);
Web3 web3 = new(account, "https://rpc-devnet-cardano-evm.c1.milkomeda.com/");

EvmService ethService = new() { Web3 = web3 };
TransactionReceipt txReceipt = await ethService.SendBaseTokenAsync(1, account.Address, account.Address, 21000);
Console.WriteLine("Send Token TxHash: {0}", txReceipt.TransactionHash);

await ethService.ListenContractEventAsync<StoreEvent>(contractAddress, abi, "StoreEvent", (logs) =>
{
    foreach (EventLog<StoreEvent> log in logs)
    {
        Console.ForegroundColor = ConsoleColor.DarkYellow;
        Console.WriteLine("StoreEvent: {0}, BlockNumber: {1}, Tx: {2}", log.Event.Num, log.Log.BlockNumber, log.Log.TransactionHash);
        Console.ForegroundColor = ConsoleColor.White;
    }
    return true;
});
Console.WriteLine("Listening for events...");
while (true)
{
    long time = DateTimeOffset.Now.ToUnixTimeSeconds();
    Console.WriteLine();
    Console.WriteLine("Store Contract Call: {0}", time);
    txReceipt = await ethService.CallContractWriteFunctionAsync(
        contractAddress,
        account.Address, abi, "store", 0,
        inputs: time
    );
    Console.WriteLine("Store TxHash: {0}", txReceipt.TransactionHash);
    Console.WriteLine("Contract Read Call Result: {0}",
        await ethService.CallContractReadFunctionAsync<int>(contractAddress, abi, "retrieve"));
    Console.WriteLine();
}