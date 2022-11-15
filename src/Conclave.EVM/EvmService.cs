using System.Numerics;
using System.Linq;
using Nethereum.Contracts;
using Nethereum.Hex.HexTypes;
using Nethereum.RPC.Eth.DTOs;
using Nethereum.Web3;

namespace Conclave.EVM;

public class EvmService
{
    private IWeb3? _web3 { get; set; }
    public IWeb3? Web3
    {
        get => _web3;
        set
        {
            _web3 = value;
            if (_web3 is null) return;
            _web3.TransactionManager.UseLegacyAsDefault = true;
            _web3.TransactionManager.EstimateOrSetDefaultGasIfNotSet = false;
            _web3.TransactionManager.CalculateOrSetDefaultGasPriceFeesIfNotSet = false;
        }
    }

    public async Task<TransactionReceipt> SendBaseTokenAsync(decimal value, string from, string to, BigInteger gasLimit)
    {
        ArgumentNullException.ThrowIfNull(_web3);
        HexBigInteger _gasPrice = await _web3.Eth.GasPrice.SendRequestAsync();
        HexBigInteger _gasLimit = new HexBigInteger(gasLimit);

        return await _web3.Eth.TransactionManager.SendTransactionAndWaitForReceiptAsync(new TransactionInput(
            string.Empty,
            to,
            from,
            _gasLimit,
            _gasPrice,
            new HexBigInteger(Nethereum.Util.UnitConversion.Convert.ToWei(value)))
        );
    }

    public async Task<TransactionReceipt> CallContractWriteFunctionAsync(string contractAddress, string from, string abi, decimal value, string name, params object[] inputs)
    {
        ArgumentNullException.ThrowIfNull(_web3);
        Contract _contract = _web3.Eth.GetContract(abi, contractAddress);
        Function _writeFunction = _contract.GetFunction(name);
        HexBigInteger _gas = await _writeFunction.EstimateGasAsync(inputs);
        string _data = _writeFunction.GetData(inputs);
        HexBigInteger _gasPrice = await _web3.Eth.GasPrice.SendRequestAsync();

        return await _web3.Eth.TransactionManager.SendTransactionAndWaitForReceiptAsync(new TransactionInput(
            _data,
            contractAddress,
            from,
            _gas, _gasPrice,
            new HexBigInteger(Nethereum.Util.UnitConversion.Convert.ToWei(0)))
        );
    }

    public async Task<T> CallContractReadFunctionAsync<T>(string contractAddress, string abi, string name, params object[] inputs)
    {
        ArgumentNullException.ThrowIfNull(_web3);
        Contract _contract = _web3.Eth.GetContract(abi, contractAddress);
        Function _readFunction = _contract.GetFunction(name);
        return await _readFunction.CallAsync<T>(inputs);
    }

    public async Task ListenContractEventAsync<T>(string contractAddress, string abi, string name, Func<List<EventLog<T>>, bool> callback) where T : new()
    {
        ArgumentNullException.ThrowIfNull(_web3);
        Contract _contract = _web3.Eth.GetContract(abi, contractAddress);
        Event contractEvent = _contract.GetEvent(name);
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