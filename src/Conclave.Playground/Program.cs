using Nethereum.Web3;
using Nethereum.Web3.Accounts;
using Conclave.Eth;
using Nethereum.RPC.Eth.DTOs;

string abi = await File.ReadAllTextAsync("abi.json");
string privateKey = "0xb5b1870957d373ef0eeffecc6e4812c0fd08f554b37b233526acc331bf1544f7";
Account account = new Account(privateKey, 200101);
Web3 web3 = new(account, "https://rpc-devnet-cardano-evm.c1.milkomeda.com/");

EvmService ethService = new() { Web3 = web3 };
TransactionReceipt txReceipt = await ethService.SendBaseTokenAsync(1, account.Address, account.Address, 21000);
Console.WriteLine("Send Token TxHash: {0}", txReceipt.TransactionHash);

txReceipt = await ethService.CallContractWriteFunctionAsync(
    "0xCA77372a728C09610BCf68a47C71c419888b380D",
    account.Address, abi, "store", 0,
    inputs: DateTimeOffset.Now.ToUnixTimeSeconds()

);

Console.WriteLine("Contract Write Call TxHash: {0}", txReceipt.TransactionHash);

Console.WriteLine("Contract Read Call Result: {0}",
    await ethService.CallContractReadFunctionAsync<int>("0xCA77372a728C09610BCf68a47C71c419888b380D", abi, "retrieve"));