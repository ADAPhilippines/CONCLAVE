using Conclave.Lotto.Web.Models;
using Microsoft.AspNetCore.Components;
using Nethereum.Metamask;
using Nethereum.UI;
using Nethereum.Hex.HexTypes;
using Nethereum.RPC.Eth.DTOs;
using Nethereum.Signer;
using Nethereum.Util;
using Nethereum.Web3;
using Nethereum.Web3.Accounts;
using System.Numerics;
using Nethereum.Hex.HexConvertors.Extensions;
namespace Conclave.Lotto.Web.Services;

public class NethereumService
{
    public IEthereumHostProvider _ethereumHostProvider { get; set; }
    public HttpClient _httpClient { get; set; }

    public string AccountAddress { get; set; }

    public NethereumService(MetamaskHostProvider metamaskHostProvider, HttpClient httpClient)
    {
        _ethereumHostProvider = metamaskHostProvider;
        _httpClient = httpClient;
    }

    public async Task<string> ConnectMetamaskWalletAsync()
    {
        var connectResult = await _ethereumHostProvider.CheckProviderAvailabilityAsync();
        Console.WriteLine(connectResult);
        await _ethereumHostProvider.EnableProviderAsync();

        var web3 = await _ethereumHostProvider.GetWeb3Async();

        web3.TransactionManager.UseLegacyAsDefault = true;
        web3.TransactionManager.EstimateOrSetDefaultGasIfNotSet = false;
        web3.TransactionManager.CalculateOrSetDefaultGasPriceFeesIfNotSet = false;
        AccountAddress = web3.TransactionManager.Account != null ? web3.TransactionManager.Account.Address :
            await _ethereumHostProvider.GetProviderSelectedAccountAsync();

        return AccountAddress;
    }

    public async Task<int> RetrieveDataFromContractAsync()
    {
        var web3 = await _ethereumHostProvider.GetWeb3Async();
        var abi = await _httpClient.GetStringAsync("abi.json");

        var contract = web3.Eth.GetContract(abi, "0xCA77372a728C09610BCf68a47C71c419888b380D");
        var retrieveFunction = contract.GetFunction("retrieve");

        var contractValue = await retrieveFunction.CallAsync<int>();
        return contractValue;
    }

    public async Task SetDataFromContractAsync()
    {
        var web3 = await _ethereumHostProvider.GetWeb3Async();
        var abi = await _httpClient.GetStringAsync("abi.json");

        var nonce = await web3.Eth.Transactions.GetTransactionCount.SendRequestAsync(AccountAddress);
        var gasPrice = await web3.Eth.GasPrice.SendRequestAsync();
        var time = DateTimeOffset.Now.ToUnixTimeSeconds();

        
        Console.WriteLine("Nonce: {0}", nonce);
        Console.WriteLine("Gas Price: {0}", gasPrice);
        Console.WriteLine("Timestamp: {0}", time);


        var contract = web3.Eth.GetContract(abi, "0xCA77372a728C09610BCf68a47C71c419888b380D");
        var storeFunction = contract.GetFunction("store");
        var gas = await storeFunction.EstimateGasAsync(time);
        var data = storeFunction.GetData(time);

        Console.WriteLine("Estimate Gas: {0}", gas);


        var tx = new LegacyTransaction(
        "0xCA77372a728C09610BCf68a47C71c419888b380D",
        Nethereum.Util.UnitConversion.Convert.ToWei(0),
        nonce,
        gasPrice,
        gas,
        data);

        Console.WriteLine("Test Store: {0}", data);
        Console.WriteLine("Unsigned Raw Tx: {0}", $"0x{tx.GetRLPEncoded().ToHex()}");

        var txReceipt = await web3.Eth.TransactionManager.SendTransactionAndWaitForReceiptAsync(new TransactionInput(
            data,
            "0xCA77372a728C09610BCf68a47C71c419888b380D",
            AccountAddress,
            gas, gasPrice,
            new HexBigInteger(Nethereum.Util.UnitConversion.Convert.ToWei(0)))
        );

        Console.WriteLine("TxHash: {0}", txReceipt.TransactionHash);
        Console.WriteLine("Fee: {0}", Nethereum.Util.UnitConversion.Convert.FromWei(txReceipt.GasUsed.Value *
        txReceipt.EffectiveGasPrice.Value));
    }
}