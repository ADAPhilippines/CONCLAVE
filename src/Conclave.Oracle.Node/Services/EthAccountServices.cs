using Conclave.Oracle.Node.Models;
using Conclave.Oracle.Node.Services.Bases;
using Microsoft.Extensions.Options;
using Nethereum.Web3;
using Nethereum.Web3.Accounts;
using Nethereum.Hex.HexTypes;
using Nethereum.Contracts;
using Nethereum.RPC.Eth.DTOs;
using Nethereum.Util;
using System.Numerics;
using Nethereum.RPC.NonceServices;
using Nethereum.Contracts.ContractHandlers;
using Nethereum.ABI.FunctionEncoding.Attributes;

namespace Conclave.Oracle.Node.Services;

public class EthAccountServices : WalletServiceBase
{
    private const int EVENT_LOG_DURATION = 100;
    private const int NONCE_AWAITER_DURATION = 100;
    private readonly Web3 Web3;
    private readonly Account Account;
    private readonly AccountOfflineTransactionSigner TransactionSigner = new AccountOfflineTransactionSigner();
    public EthAccountServices(IOptions<SettingsParameters> settings, IConfiguration configuration) : base(settings.Value.EthereumRPC, configuration)
    {
        string privateKey = configuration.GetValue<string>("PrivateKey")!;
        Account = new Account(privateKey);
        Web3 = new Web3(Account, settings.Value.EthereumRPC);
        Address = Account.Address;
        Account.NonceService = new InMemoryNonceService(Account.Address, Web3.Client);
    }

    public async Task<HexBigInteger> GetBalanceAsync() => await Web3.Eth.GetBalance.SendRequestAsync(Address);

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

    public async Task<TResult> CallContractReadFunctionAsync<T,TResult>(
        T contractFunction,
        string contractAddress) 
        where T : FunctionMessage, new()
        where TResult : IFunctionOutputDTO, new()
    {
        ContractHandler contractHandler = Web3.Eth.GetContractHandler(contractAddress);

        return await contractHandler.QueryDeserializingToObjectAsync<T, TResult>(contractFunction, null);
    }

    public async Task CallContractWriteFunctionAsync(
        string contractAddress,
        string abi,
        decimal value,
        string functionName)
    {
        Contract contract = Web3.Eth.GetContract(abi, contractAddress);
        Function writeFunction = contract.GetFunction(functionName);
        HexBigInteger gas = await writeFunction.EstimateGasAsync();
        HexBigInteger gasPrice = await Web3.Eth.GasPrice.SendRequestAsync();
        string data = writeFunction.GetData();

        TransactionInput transactionInput = new TransactionInput(
            data,
            contractAddress,
            Address,
            gas,
            gasPrice,
            new HexBigInteger(UnitConversion.Convert.ToWei(0)));

        HexBigInteger futureNonce = await WaitForNonceAsync();
        transactionInput.Nonce = futureNonce;

        await Web3.Eth.TransactionManager.SendTransactionAndWaitForReceiptAsync(transactionInput);
    }

    public async Task CallContractWriteFunctionAsync(
        string contractAddress,
        string abi,
        decimal value,
        string functionName,
        params object[] inputs)
    {
        Contract contract = Web3.Eth.GetContract(abi, contractAddress);
        Function writeFunction = contract.GetFunction(functionName);
        HexBigInteger gas = await writeFunction.EstimateGasAsync(inputs);
        HexBigInteger gasPrice = await Web3.Eth.GasPrice.SendRequestAsync();
        string data = writeFunction.GetData(inputs);

        TransactionInput transactionInput = new TransactionInput(
                   data,
                   contractAddress,
                   Address,
                   gas,
                   gasPrice,
                   new HexBigInteger(UnitConversion.Convert.ToWei(0)));

        HexBigInteger futureNonce = await WaitForNonceAsync();
        transactionInput.Nonce = futureNonce;

        await Web3.Eth.TransactionManager.SendTransactionAndWaitForReceiptAsync(transactionInput);
    }

    public async Task ListenContractEventAsync<T>(string contractAddress, string abi, string functionName, Func<List<EventLog<T>>, Task<bool>> callback) where T : new()
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
                    _ = Task.Run(async () =>
                    {
                        shouldRun = await callback(filteredLogs);
                        lastLogs = filteredLogs;
                    });

                await Task.Delay(EVENT_LOG_DURATION);
            }
        });
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
                    _ = Task.Run(() =>
                    {
                        shouldRun = callback(filteredLogs);
                        lastLogs = filteredLogs;
                    });

                await Task.Delay(EVENT_LOG_DURATION);
            }
        });
    }

    private async Task<HexBigInteger> GetTransactionCountAsync()
    {
        return await Web3.Eth.Transactions.GetTransactionCount.SendRequestAsync(Address);
    }

    private async Task<HexBigInteger> GetFutureNonceAsync()
    {
        return await Account.NonceService.GetNextNonceAsync();
    }

    private async Task<HexBigInteger> WaitForNonceAsync()
    {
        HexBigInteger currentTransaction = await GetTransactionCountAsync();
        HexBigInteger futureNonce = await GetFutureNonceAsync();

        while (BigInteger.Parse(currentTransaction.ToString()) < BigInteger.Parse(futureNonce.ToString()))
        {
            await Task.Delay(NONCE_AWAITER_DURATION);
            currentTransaction = await GetTransactionCountAsync();
        }

        return futureNonce;
    }
}