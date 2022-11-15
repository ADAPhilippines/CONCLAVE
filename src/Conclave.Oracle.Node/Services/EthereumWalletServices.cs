using Conclave.Oracle.Node.Models;
using Conclave.Oracle.Node.Services.Bases;
using Microsoft.Extensions.Options;
using Nethereum.Web3;
using Nethereum.Web3.Accounts;
using Nethereum.Hex.HexTypes;
using Nethereum.Contracts;
using Nethereum.RPC.Eth.DTOs;
using Nethereum.Util;

namespace Conclave.Oracle.Node.Services;

public class EthereumWalletServices : WalletServiceBase
{
    private readonly Web3 Web3;
    private readonly Account Account;
    private readonly AccountOfflineTransactionSigner TransactionSigner = new AccountOfflineTransactionSigner();
    public EthereumWalletServices(
        IOptions<SettingsParameters> settings) : base(settings.Value.PrivateKey, settings.Value.EthereumRPC)
    {
        Account = new Account(settings.Value.PrivateKey);
        Web3 = new Web3(Account, settings.Value.EthereumRPC);
        Address = Account.Address;
    }
    
    public async Task<HexBigInteger> GetBalance()
    {
        return await Web3.Eth.GetBalance.SendRequestAsync(Account.Address);
    }

    public async Task<T> CallContractReadFunctionAsync<T>(
        string contractAddress,
        string abi,
        string functionName,
        params object[]? inputs)
    {
        Contract contract = Web3.Eth.GetContract(abi, contractAddress);
        Function readFunction = contract.GetFunction(functionName);
        return await readFunction.CallAsync<T>(inputs);
    }

    public async Task<T> CallContractReadFunctionNoParamsAsync<T>(string contractAddress, string abi, string functionName)
    {
        Contract contract = Web3.Eth.GetContract(abi, contractAddress);
        Function readFunction = contract.GetFunction(functionName);
        return await readFunction.CallAsync<T>();
    }

    public async Task<TransactionReceipt> CallContractWriteFunctionAsync(
        string contractAddress,
        string from,
        string abi,
        string name,
        decimal value,
        params object[] inputs)
    {
        Contract contract = Web3.Eth.GetContract(abi, contractAddress);
        Function writeFunction = contract.GetFunction(name);
        HexBigInteger gas = await writeFunction.EstimateGasAsync(inputs);
        string data = writeFunction.GetData(inputs);
        HexBigInteger gasPrice = await Web3.Eth.GasPrice.SendRequestAsync();

        return await Web3.Eth.TransactionManager.SendTransactionAndWaitForReceiptAsync(new TransactionInput(
            data,
            contractAddress,
            from,
            gas,
            gasPrice,
            new HexBigInteger(UnitConversion.Convert.ToWei(0)))
        );
    }


    public async Task ListenContractEventAsync<T>(string contractAddress, string abi, string functionName, Func<List<EventLog<T>>, bool> callback) where T : new()
    {
        Contract contract = Web3.Eth.GetContract(abi, contractAddress);
        Event contractEvent = contract.GetEvent(functionName);
        HexBigInteger filterId = await contractEvent.CreateFilterAsync(BlockParameter.CreateLatest());
        List<EventLog<T>>? lastLogs = await contractEvent.GetAllChangesAsync<T>(filterId);

        _ = Task.Run(async () =>
        {
            bool shouldRun = true;
            while (shouldRun)
            {
                List<EventLog<T>>? newLogs = await contractEvent.GetAllChangesAsync<T>(filterId);
                List<EventLog<T>>? filteredLogs = newLogs.Where(newLog =>
                    !lastLogs.Any(
                        oldLog => oldLog.Log.TransactionHash == newLog.Log.TransactionHash &&
                        oldLog.Log.TransactionIndex == newLog.Log.TransactionIndex)
                ).ToList();

                if (filteredLogs.Count > 0)
                {
                    _ = Task.Run(() =>
                    {
                        shouldRun = callback(filteredLogs);
                        lastLogs = filteredLogs;
                    });
                }
                await Task.Delay(100);
            }
        });
    }
}