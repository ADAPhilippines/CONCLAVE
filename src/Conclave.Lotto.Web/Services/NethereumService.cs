using Conclave.Lotto.Web.Models;
using Microsoft.AspNetCore.Components;
using Nethereum.Metamask;
using Nethereum.UI;

namespace Conclave.Lotto.Web.Services;

public class NethereumService
{
    public MetamaskHostProvider? MetamaskHostProvider { get; set; }

    public IEthereumHostProvider _ethereumHostProvider { get; set; }

    public NethereumService(MetamaskHostProvider metamaskHostProvider)
    {
        _ethereumHostProvider = metamaskHostProvider;
        Console.WriteLine($"Provider: {_ethereumHostProvider}");

    }

    public async Task ConnectMetamaskWalletAsync()
    {
        var connectResult = await _ethereumHostProvider.CheckProviderAvailabilityAsync();
        Console.WriteLine(connectResult);
        await _ethereumHostProvider.EnableProviderAsync();

        var web3 = await _ethereumHostProvider.GetWeb3Async();

        web3.TransactionManager.UseLegacyAsDefault = true;
        web3.TransactionManager.EstimateOrSetDefaultGasIfNotSet = false;
        web3.TransactionManager.CalculateOrSetDefaultGasPriceFeesIfNotSet = false;
        var accountAddress = web3.TransactionManager.Account != null ? web3.TransactionManager.Account.Address :
                await _ethereumHostProvider.GetProviderSelectedAccountAsync();

        Console.WriteLine("Connected Account: {0}", accountAddress);
    }
}